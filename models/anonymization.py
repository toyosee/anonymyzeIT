from sklearn.preprocessing import StandardScaler
import numpy as np

def anonymize_data(data):
    # Convert data to numpy array
    data_array = np.array(data).reshape(-1, 1)

    # Example anonymization technique: scaling data
    scaler = StandardScaler()
    anonymized_data = scaler.fit_transform(data_array)

    # Convert back to a list for JSON serialization
    return anonymized_data.tolist()
