import axios from "axios";

// Backend endpoint for all prompt handling
const BACKEND_URL = "http://localhost:5000/generate-response";

async function run(prompt) {
  if (!prompt.trim()) {
    return "Error: No prompt provided.";
  }

  try {
    // Send prompt to backend for moderation and response
    const response = await axios.post(BACKEND_URL, { text: prompt });
    // The backend returns { response: "..." }
    return response.data.response;
  } catch (error) {
    // Handle HTTP status errors (like 403 from content moderation)
    if (error.response && error.response.data && error.response.data.response) {
      // This is for flagged content - return the moderation message
      return error.response.data.response;
    }
    
    // For server errors or connection issues
    console.error("Error communicating with backend:", error);
    return "Error: Unable to process your request at this time.";
  }
}

export default run;
