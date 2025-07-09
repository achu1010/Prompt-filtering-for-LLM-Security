from transformers import pipeline
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from googletrans import Translator
from langdetect import detect
import google.generativeai as genai
import traceback
from collections import defaultdict

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

os.environ["PYTHONIOENCODING"] = "utf-8"
print("Starting hate speech detection server...")

# Gemini AI API setup
gemini_api_key = "AIzaSyBO4wCO6cv0MVXpI4b6gzX9PPfcAYfuQ2Y"
genai.configure(api_key=gemini_api_key)
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
)
chat_session = model.start_chat(history=[])

# Create separate sessions for different tasks
moderation_session = model.start_chat(history=[])  # For content moderation
similarity_session = model.start_chat(history=[])  # For thread similarity checks
response_session = model.start_chat(history=[])    # For generating responses

# Threaded flagged prompt storage
flagged_prompt_threads = defaultdict(list)
last_thread_id = 0

# Hate speech detection model
try:
    print("Loading hate speech detection model...")
    speech_detector = pipeline(
        "text-classification",
        model="Hate-speech-CNERG/bert-base-uncased-hatexplain",
        device=-1  # Use -1 for CPU, 0 for GPU
    )
    print("Hate speech model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
    speech_detector = None

translator = Translator()

def detect_language_gemini(input_text):
    """Detects the language of the input text using Gemini AI."""
    prompt = f"""
    Detect the language of the following text.
    Provide only the language name, without additional text.
    Input: {input_text}
    """
    try:
        response = moderation_session.send_message(prompt)
        return response.text.strip().lower()
    except Exception as e:
        print(f"Error detecting language with Gemini: {e}")
        return "unknown"

def translate_to_english_gemini(input_text):
    """Translates non-English text to English using Gemini AI."""
    prompt = f"""
    Translate the following text into English.
    Provide only the translated text, without additional text.
    Input: {input_text}
    """
    try:
        response = moderation_session.send_message(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error translating with Gemini: {e}")
        return input_text

def classify_message(message):
    """Classifies a message for hate or offensive speech."""
    if speech_detector is None:
        print("Error: Hate speech detection model is not loaded.")
        return "unknown", 0.0
    try:
        classification = speech_detector(message)
        label = classification[0]['label'].lower()
        score = classification[0]['score']
        return label, score
    except Exception as e:
        print(f"Error classifying message: {e}")
        traceback.print_exc()
        return "unknown", 0.0

def check_relation_with_previous_threads(new_prompt):
    """Check if the new prompt is related to any existing flagged prompt threads."""
    global flagged_prompt_threads
    if not flagged_prompt_threads:
        return None
        
    # Look for common follow-up indicators
    lower_prompt = new_prompt.lower()
    follow_up_indicators = ["previous", "before", "last", "you said", "why", "what did", "i asked", 
                           "about that", "i meant", "i just", "you flagged", "flagged", "blocked",
                           "what's wrong", "what is wrong"]
    
    # Check for simple follow-up indicators first
    has_indicator = any(indicator in lower_prompt for indicator in follow_up_indicators)
    
    for thread_id, prompts in flagged_prompt_threads.items():
        reference_prompt = prompts[0]
        
        # If there's an indicator word AND this thread was flagged recently, be more strict
        if has_indicator and thread_id == last_thread_id:
            print(f"[⚠️] Potential follow-up detected to thread {thread_id}")
            return thread_id
            
        # Otherwise use the semantic check
        if check_relation_with_previous(reference_prompt, new_prompt):
            print(f"[🔗] New message is related to thread {thread_id}")
            return thread_id
            
    return None

def check_relation_with_previous(harmful_prompt, new_prompt):
    """Uses Gemini AI to determine if the new prompt refers to or is related to the previous harmful prompt."""
    prompt = f"""
    The user previously submitted the following harmful text that was flagged: '{harmful_prompt}'.
    
    Now, they have entered a new prompt: '{new_prompt}'.

    Carefully analyze if the new prompt:
    1. References the previous harmful content
    2. Asks about the flagging of the previous content
    3. Attempts to rephrase or modify the previous harmful content
    4. Tries to continue the conversation about the harmful topic
    5. Asks why their previous message was flagged
    6. Contains words like "previous", "before", "last time", "you said", etc.
    
    Answer with 'yes' if ANY of the above conditions are met, otherwise 'no'.
    """
    try:
        # Use dedicated similarity session to maintain similarity check context
        response = similarity_session.send_message(prompt)
        return "yes" in response.text.lower()
    except Exception as e:
        print(f"Error checking relation with previous: {e}")
        return False

def get_best_english(text):
    """
    Detects language using both langdetect and Gemini, and translates if either says not English.
    Returns the best English translation and logs the process.
    """
    try:
        detected_language_langdetect = detect(text)
    except:
        detected_language_langdetect = "unknown"
    detected_language_gemini = detect_language_gemini(text)
    print(f"[LANG] langdetect: {detected_language_langdetect}")
    print(f"[LANG] Gemini: {detected_language_gemini}")

    needs_translation = (
        detected_language_langdetect != 'en'
        or detected_language_gemini not in ['en', 'english']
    )

    translated_google = text
    if needs_translation and detected_language_langdetect != 'unknown':
        try:
            translated_google = translator.translate(text, src=detected_language_langdetect, dest='en').text
            print(f"[TRANS] googletrans: {translated_google}")
        except Exception as e:
            print(f"[TRANS] Error with GoogleTrans: {e}")

    translated_gemini = text
    if needs_translation and detected_language_gemini != 'english':
        translated_gemini = translate_to_english_gemini(text)
        print(f"[TRANS] Gemini: {translated_gemini}")

    if translated_gemini and translated_gemini != text:
        english_text = translated_gemini
    elif translated_google and translated_google != text:
        english_text = translated_google
    else:
        english_text = text

    return english_text

def moderate_and_flag(text, is_response=False):
    """
    Checks for thread similarity and hate/offensive content.
    Returns (is_safe, message, thread_id, details)
    """
    english_text = get_best_english(text)
    log_prefix = "[RESPONSE]" if is_response else "[PROMPT]"

    # Thread similarity check
    related_thread_id = check_relation_with_previous_threads(english_text)
    if related_thread_id is not None:
        flagged_prompt_threads[related_thread_id].append(english_text)
        # Add [WARNING] prefix to ensure consistent red styling
        return False, f"[WARNING] Content flagged: Related to previously flagged harmful content (Thread #{related_thread_id}).", related_thread_id, {}

    # Hate speech/offensive check with HuggingFace model
    label_google, score_google = classify_message(english_text)
    label_gemini, score_gemini = classify_message(english_text)
    print(f"{log_prefix} Classification (googletrans): {label_google}, Score: {score_google}")
    print(f"{log_prefix} Classification (Gemini): {label_gemini}, Score: {score_gemini}")

    # Internal tracking of which systems flagged the content (for logging only)
    flagged_by = []
    offensive_labels = ["hate", "offensive", "hate speech", "hatespeech"]
    if any(label in label_google.lower() for label in offensive_labels) and score_google > 0.1:
        flagged_by.append(f"GoogleTrans: {label_google} ({score_google:.2f})")
    if any(label in label_gemini.lower() for label in offensive_labels) and score_gemini > 0.1:
        flagged_by.append(f"GeminiTrans: {label_gemini} ({score_gemini:.2f})")

    # Additional content moderation check
    is_offensive, reason = gemini_moderation_check(english_text)
    if is_offensive:
        flagged_by.append(f"ContentMod: {reason}")
        print(f"{log_prefix} Content moderation flagged: {reason}")

    if flagged_by:
        global last_thread_id
        last_thread_id += 1
        flagged_prompt_threads[last_thread_id].append(english_text)
        
        # For internal logging only - doesn't show to user
        internal_flag_message = f"Content flagged by: {', '.join(flagged_by)}"
        print(f"{log_prefix} [🚫] {internal_flag_message}")
        
        # Generic message for user with warning indicator and thread information
        if "hate" in internal_flag_message.lower():
            user_message = f"[WARNING] Content flagged: Contains hate speech. (Thread #{last_thread_id})"
        elif "offensive" in internal_flag_message.lower():
            user_message = f"[WARNING] Content flagged: Contains offensive content. (Thread #{last_thread_id})"
        else:
            user_message = f"[WARNING] Content flagged: Contains offensive content. (Thread #{last_thread_id})"
            
        return False, user_message, last_thread_id, {
            "label_google": label_google,
            "score_google": score_google,
            "label_gemini": label_gemini, 
            "score_gemini": score_gemini
        }

    print(f"{log_prefix} [✅] Content passed all checks.")
    return True, "Content appears safe", None, {
        "label_google": label_google,
        "score_google": score_google,
        "label_gemini": label_gemini,
        "score_gemini": score_gemini
    }

def gemini_moderation_check(text):
    """Uses Gemini to check if the text contains hate speech or offensive content."""
    prompt = f"""
    Analyze the following text for hate speech, racism, sexism, offensive content, or harmful stereotypes.
    If it contains ANY problematic content, answer 'yes' followed by a brief explanation.
    If it doesn't contain problematic content, just answer 'no'.

    Text: {text}
    """
    try:
        response = moderation_session.send_message(prompt)
        response_text = response.text.lower()
        
        if "yes" in response_text:
            parts = response_text.split("yes", 1)
            reason = parts[1].strip() if len(parts) > 1 else "contains offensive or harmful content"
            return True, reason
        return False, ""
    except Exception as e:
        print(f"Error in Gemini moderation check: {e}")
        return False, ""

@app.route('/generate-response', methods=['POST'])
def generate_response():
    data = request.json
    user_prompt = data.get('text', '')

    if not user_prompt:
        return jsonify({"response": "No prompt provided."}), 400

    # Step 1: Moderation and thread check for user prompt
    is_safe, message, thread_id, details = moderate_and_flag(user_prompt, is_response=False)
    if not is_safe:
        # Return the warning message with a 403 status code
        return jsonify({"response": message}), 403

    # Step 2: Generate AI response (only if safe)
    try:
        english_prompt = get_best_english(user_prompt)
        
        # Use persistent response session (don't reset it)
        gemini_response = response_session.send_message(english_prompt)
        ai_text = gemini_response.text
    except Exception as e:
        print(f"Error generating AI response: {e}")
        return jsonify({"response": "[WARNING] Error generating response."}), 500

    # Step 3: Moderate the response before returning to user
    is_safe_resp, message_resp, thread_id_resp, details_resp = moderate_and_flag(ai_text, is_response=True)
    if not is_safe_resp:
        # Return the warning message with a 403 status code
        if thread_id_resp:
            return jsonify({"response": f"[WARNING] Content flagged: Related to previously flagged harmful content (Thread #{thread_id_resp})"}), 403
        else:
            return jsonify({"response": "[WARNING] The generated response was flagged for inappropriate content."}), 403

    return jsonify({"response": ai_text})

@app.route('/test', methods=['GET'])
def test():
    return jsonify({"status": "Hate speech detection server is running"})

if __name__ == '__main__':
    print("Starting Flask server on port 5000...")
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)