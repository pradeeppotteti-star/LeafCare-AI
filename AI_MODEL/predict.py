import os
import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image

try:
    from .disease_info import disease_info
except ImportError:
    from disease_info import disease_info


# ==========================================
# Load Trained MobileNetV3 Model
# ==========================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "TRAINED_MODEL",
    "tomato_leaf_model.keras"
)

print("Loading model from:")
print(MODEL_PATH)

model = tf.keras.models.load_model(MODEL_PATH)

print("AI Model loaded successfully!")


# ==========================================
# Disease Classes
# ==========================================

class_names = [
    "Tomato_Bacterial_spot",
    "Tomato_Early_blight",
    "Tomato_Late_blight",
    "Tomato_Leaf_Mold",
    "Tomato_Septoria_leaf_spot",
    "Tomato_Spider_mites",
    "Tomato_Target_Spot",
    "Tomato_Tomato_YellowLeaf_Curl_Virus",
    "Tomato_Tomato_mosaic_virus",
    "Tomato_healthy"
]


# ==========================================
# Prediction Function
# ==========================================

def predict_image(image_path):

    # Load image
    img = image.load_img(
        image_path,
        target_size=(224, 224)
    )

    # Convert image to array
    img_array = image.img_to_array(img)

    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)

    # IMPORTANT: MobileNetV3 preprocessing
    img_array = tf.keras.applications.mobilenet_v3.preprocess_input(img_array)

    # Predict
    prediction = model.predict(img_array, verbose=0)

    print("\n==============================")
    print("Prediction Scores")
    print("==============================")

    for i, score in enumerate(prediction[0]):
        print(f"{class_names[i]:40s} : {score*100:.2f}%")

    predicted_index = np.argmax(prediction)

    confidence = float(np.max(prediction) * 100)

    print("------------------------------")
    print("Predicted Class :", class_names[predicted_index])
    print("Confidence      :", round(confidence, 2))
    print("==============================\n")

    # ==========================================
    # Invalid Image Detection
    # ==========================================

    if confidence < 70:
        return {
            "success": False,
            "message": "Invalid image. Please upload a clear tomato leaf image.",
            "confidence": round(confidence, 2)
        }

    # ==========================================
    # Disease Severity
    # ==========================================

    if confidence >= 95:
        severity = "High"
    elif confidence >= 85:
        severity = "Medium"
    else:
        severity = "Low"

    predicted_disease = class_names[predicted_index]

    info = disease_info[predicted_disease]

    # ==========================================
    # Return Result
    # ==========================================

    return {
        "success": True,
        "disease": predicted_disease.replace("_", " "),
        "confidence": round(confidence, 2),
        "severity": severity,
        "symptoms": info["symptoms"],
        "treatment": info["treatment"],
        "prevention": info["prevention"],
        "fertilizer": info["fertilizer"]
    }


# ==========================================
# Test
# ==========================================

if __name__ == "__main__":

    result = predict_image("TEST_IMAGES/tomato.JPG")

    print(result)