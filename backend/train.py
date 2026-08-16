import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
import json
import os

# Define paths
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "crop_data.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "app", "ml")
MODEL_PATH = os.path.join(MODEL_DIR, "crop_model.json")
LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.json")

def train_model():
    print("Loading dataset...")
    try:
        df = pd.read_csv(DATA_PATH)
    except FileNotFoundError:
        print(f"Error: Dataset not found at {DATA_PATH}")
        return

    print("Preprocessing data...")
    X = df[['Temperature', 'Humidity', 'Rainfall', 'pH', 'N', 'P', 'K', 'Budget']]
    y = df['Crop']

    # Encode crop labels to numeric
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # Split dataset
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

    # Train XGBoost Model
    print("Training XGBoost Classifier...")
    model = xgb.XGBClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=4,
        random_state=42,
        eval_metric='mlogloss'
    )
    
    model.fit(X_train, y_train)
    
    print("Evaluating model...")
    accuracy = model.score(X_test, y_test)
    print(f"Model Accuracy on Test Set: {accuracy * 100:.2f}%")

    # Save Model and Labels
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    model.save_model(MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

    labels_dict = {index: label for index, label in enumerate(le.classes_)}
    with open(LABEL_ENCODER_PATH, "w") as f:
        json.dump(labels_dict, f)
    print(f"Label encodings saved to {LABEL_ENCODER_PATH}")
    print("\nTraining Pipeline Complete! You can now drop these JSON files into the backend to power the API.")

if __name__ == "__main__":
    train_model()
