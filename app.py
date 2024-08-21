from flask import Flask, request, jsonify
from flask_cors import CORS
from faker import Faker
import pandas as pd
import random
import re
import numpy as np

app = Flask(__name__)
fake = Faker()
CORS(app)  # Enable CORS

# Utility functions to clean and format data
def clean_phone_number(number):
    """Normalize phone number format to xxx-xxx-xxxx"""
    cleaned = re.sub(r'\D', '', str(number))
    if len(cleaned) == 10:
        return f"{cleaned[:3]}-{cleaned[3:6]}-{cleaned[6:]}"
    return None  # Return None if format is invalid

def clean_email(email):
    """Validate and return a cleaned email address"""
    if re.match(r"[^@]+@[^@]+\.[^@]+", str(email)):
        return email
    return fake.email()  # Return a fake email if invalid

def clean_website(website):
    """Return a fake website if the input is invalid"""
    if isinstance(website, str) and website.strip():
        return website.strip()  # Return original website if valid
    return fake.url()  # Generate a fake URL if invalid

def clean_string(value):
    """Clean and capitalize strings"""
    return value.strip().title() if isinstance(value, str) else value

def clean_numerical(value):
    """Handle numerical anomalies"""
    return round(value, 2) if isinstance(value, (int, float)) else value

def anonymize_value(key, value):
    """Anonymize fields based on their key"""
    if pd.isna(value):
        return None  # Handle NaN values

    # Handle specific fields based on the key
    if re.search(r'\bname\b', key, re.IGNORECASE):
        return fake.name()  # Generate a fake name
    elif re.search(r'\bemail\b', key, re.IGNORECASE):
        return clean_email(value)  # Clean and anonymize email
    elif re.search(r'\bwebsite\b', key, re.IGNORECASE):
        return clean_website(value)  # Clean and anonymize website
    elif re.search(r'\bphone\b', key, re.IGNORECASE):
        return clean_phone_number(value)  # Clean and anonymize phone number
    elif re.search(r'\bworked directly\b', key, re.IGNORECASE):
        return random.choice(["Yes", "No"])  # Randomize Yes/No
    else:
        # Clean other strings and numerical data
        if isinstance(value, str):
            return clean_string(value)  # Clean string values
        else:
            return clean_numerical(value)  # Clean numerical values

def pseudonymize_data(df):
    """Pseudonymize the entire DataFrame"""
    pseudonymized_data = []
    for _, row in df.iterrows():
        pseudonymized_row = {key: anonymize_value(key, value) for key, value in row.items()}
        pseudonymized_data.append(pseudonymized_row)
    return pseudonymized_data

@app.route('/anonymize', methods=['POST'])
def anonymize_data():
    """Endpoint to anonymize data from a JSON payload"""
    try:
        # Retrieve JSON data from the request
        data = request.json.get('data', [])
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Convert JSON to DataFrame
        df = pd.DataFrame(data)
        
        # Pseudonymize data
        pseudonymized_data = pseudonymize_data(df)
        
        # Return pseudonymized data
        return jsonify({"pseudonymized_data": pseudonymized_data}), 200
    
    except Exception as e:
        # Catch and log any errors
        print("Error during anonymization:", str(e))
        return jsonify({"error": str(e)}), 400

@app.route('/upload', methods=['POST'])
def upload_file():
    """Endpoint to upload a file and anonymize its content"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        # Determine file type and read accordingly
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file)
        else:
            return jsonify({"error": "Unsupported file type"}), 400

        # Pseudonymize data
        pseudonymized_data = pseudonymize_data(df)
        
        # Return pseudonymized data
        return jsonify({"pseudonymized_data": pseudonymized_data}), 200

    except Exception as e:
        # Catch and log any errors
        print("Error during file upload:", str(e))
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
