import pandas as pd


def load_data():
    """
    Loads the universities and students datasets from CSV files.
    Returns:
        tuple: A tuple containing two pandas DataFrames: students_df
        and universities_df.
    """
    universities_df = pd.read_csv('../../datasets/universities_dataset.csv')
    students_df = pd.read_csv('../../datasets/students_dataset.csv')
    return students_df, universities_df
