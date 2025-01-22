import spacy
import string
import json

# Load spaCy model for text processing
nlp = spacy.load("en_core_web_sm")


def preprocess_text(text):
    """
    Preprocesses the input text by converting to lowercase,
    removing punctuation and stopwords, and applying lemmatization.
    Args:
        text (str): The text to be processed.
    Returns:
        str: The processed text.
    """
    # Process the text with spaCy
    doc = nlp(text.lower())
    # Remove punctuation and stopwords, and apply lemmatization
    words = [token.lemma_ for token in doc if token.text not in
             string.punctuation and not token.is_stop]
    return ' '.join(words)


def clean_degree_fields(degree_fields):
    """
    Cleans and parses the Degree Fields column by flattening nested JSON data
    into a string.
    Args:
        degree_fields (str): The degree fields in JSON format.
    Returns:
        str: A string representation of the degree fields.
    """
    try:
        data = json.loads(degree_fields)
        flattened = []
        for level, fields in data.items():
            for field, languages in fields.items():
                flattened.append(f"{level}: {field} ({', '.join(languages)})")
        return ", ".join(flattened)
    except json.JSONDecodeError:
        return degree_fields  # Return as-is if not valid JSON


def preprocess_data(students_df, universities_df):
    """
    Preprocesses the student and university datasets by applying text
    preprocessing to the relevant features (e.g., degree fields, study field,
    etc.).
    Args:
        students_df (DataFrame): The students dataset.
        universities_df (DataFrame): The universities dataset.
    Returns:
        tuple: A tuple containing the preprocessed students_df
        and universities_df.
    """
    # Clean the Degree Fields column in universities dataset
    universities_df['Degree Fields'] = universities_df['Degree Fields'].apply(
        clean_degree_fields)

   # Apply text preprocessing to students' combined features
    students_df['combined_features'] = students_df.apply(
    lambda row: preprocess_text(
        f"{row['Study Field']} {row['Academic Level']} {row['Language Proficiency']} "
        f"{row['Country of Residence']} {row['City of Residence']} "
        f"Financial Need: {row['Financial Need']} "
        f"Accessibility Need: {row['Accessibility Need']} "
        f"Counseling Need: {row['Counseling Need']} "
        f"Accommodation Need: {row['Accommodation Need']}"
    ),
    axis=1
    )

 # Apply text preprocessing to universities' combined features
    universities_df['combined_features'] = universities_df.apply(
    lambda row: preprocess_text(
        f"{row['Degree Fields']} {row['Country']} {row['City']} "
        f"Minimum GPA: {row['Minimum GPA']} "
        f"Scholarships: {row['Scholarships']} "
        f"Financial Aid: {row['Financial Aid']} "
        f"Accessibility Services: {row['Accessibility Services']} "
        f"Counseling Services: {row['Counseling Services']}"
    ),
    axis=1
    )
    return students_df, universities_df
