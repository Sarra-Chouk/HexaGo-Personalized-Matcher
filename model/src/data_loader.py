from pymongo import MongoClient
import pandas as pd

client = MongoClient("mongodb+srv://60300372:INFS3201@infs3201.9arv1.mongodb.net/")
db = client["HexaGo"]
students_collection = db["users"]  
universities_collection = db["users"]  


def load_data():
    """
    Loads student and university data from MongoDB.
    Returns:
        tuple: (students_df, universities_df)
    """
    # Fetch only student users
    students = list(students_collection.find({"type": "Student"}))
    universities = list(universities_collection.find({"type": "University"}))

    # Convert to DataFrame
    students_df = pd.DataFrame(students)
    universities_df = pd.DataFrame(universities)

    return students_df, universities_df
