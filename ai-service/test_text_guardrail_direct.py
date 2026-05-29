import sys
import os
from fastapi.testclient import TestClient

# Ensure sys.path includes the current directory
sys.path.append(os.path.dirname(__file__))

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

from main import app

client = TestClient(app)

tests = [
    {
        "name": "Clear Medical (English)", 
        "symptoms": "severe chest pain and shortness of breath",
        "should_block": False
    },
    {
        "name": "Clear Medical (Hindi Transliterated)", 
        "symptoms": "mujhe teen din se tez bukhar hai aur badan dard ho raha hai",
        "should_block": False
    },
    {
        "name": "Clear Medical (Tamil Transliterated)", 
        "symptoms": "moochu thittam maarbu vaali kaichal irumal",
        "should_block": False
    },
    {
        "name": "Short text symptom", 
        "symptoms": "flu",
        "should_block": True
    },
    {
        "name": "Random Conversational Question", 
        "symptoms": "kaise ho bhai? kya chal raha hai?",
        "should_block": True
    },
    {
        "name": "Gibberish keyboard mash", 
        "symptoms": "asdfghjkl qwerty 12345",
        "should_block": True
    },
    {
        "name": "Repetitive spam", 
        "symptoms": "hello hello hello hello hello hello",
        "should_block": True
    }
]

def run_tests():
    print("=== SWASTHAI CLINICAL TEXT GUARDRAIL TESTS ===")
    failed = False
    
    for t in tests:
        print(f"\nTEST: {t['name']}")
        print(f"INPUT: {t['symptoms']}")
        
        response = client.post("/predict/disease", json={"symptoms": t["symptoms"]})
        if response.status_code != 200:
            print(f"❌ ERROR: Server returned status code {response.status_code}: {response.text}")
            failed = True
            continue
            
        data = response.json()
        prediction = data.get('prediction', 'N/A')
        confidence = data.get('confidence', 0)
        is_uncertain = data.get('is_uncertain', False)
        message = data.get('message', 'None')
        
        print(f"PREDICTION: {prediction}")
        print(f"CONFIDENCE: {confidence * 100:.1f}%")
        print(f"IS UNCERTAIN: {is_uncertain}")
        print(f"MESSAGE: {message}")
        
        if t["should_block"]:
            if is_uncertain and prediction == "Uncertain / Need More Info":
                print("STATUS: ✅ CORRECTLY BLOCKED")
            else:
                print(f"STATUS: ❌ FAILED (Should have been blocked as uncertain)")
                failed = True
        else:
            if not is_uncertain and prediction != "Uncertain / Need More Info":
                print("STATUS: ✅ CORRECTLY PASSED")
            else:
                print(f"STATUS: ❌ FAILED (Valid symptoms got blocked)")
                failed = True
                
        print("-" * 40)
        
    if failed:
        print("\n❌ SOME TEXT GUARDRAIL TESTS FAILED!")
        sys.exit(1)
    else:
        print("\n✅ ALL CLINICAL TEXT GUARDRAIL TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
