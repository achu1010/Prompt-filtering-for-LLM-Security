import requests
import json

def test_server():
    print("Testing connection to Flask server...")
    
    try:
        # Test basic connection
        response = requests.get("http://localhost:5000/test")
        print(f"Server status: {response.json()}")
        
        # Test content checking functionality
        test_data = {"text": "This is a test message."}
        response = requests.post("http://localhost:5000/check-content", json=test_data)
        print(f"Content check result: {json.dumps(response.json(), indent=2)}")
        
        # Test offensive content
        test_data = {"text": "I hate everyone."}
        response = requests.post("http://localhost:5000/check-content", json=test_data)
        print(f"Offensive content check result: {json.dumps(response.json(), indent=2)}")
        
        print("Server tests completed successfully!")
    except Exception as e:
        print(f"Error testing server: {e}")

if __name__ == "__main__":
    test_server()