from sentence_transformers import SentenceTransformer
import faiss
import numpy as np


def generate_embeddings(students_df, universities_df):
    """
    Generates embeddings for students and universities using Sentence
    Transformer.
    Args:
        students_df (DataFrame): The preprocessed students dataset.
        universities_df (DataFrame): The preprocessed universities dataset.
    Returns:
        tuple: A tuple containing numpy arrays for student and university
        embeddings.
    """
    model = SentenceTransformer('all-MiniLM-L6-v2')

    student_embeddings = model.encode(students_df['combined_features']
                                      .tolist(), show_progress_bar=True)
    university_embeddings = model.encode(universities_df['combined_features']
                                         .tolist(), show_progress_bar=True)

    # Normalize embeddings for cosine similarity
    student_embeddings = np.array([embedding / np.linalg.norm(embedding) 
                                   for embedding in student_embeddings])
    university_embeddings = np.array([embedding / np.linalg.norm(embedding) 
                                      for embedding in university_embeddings])

    return student_embeddings, university_embeddings


def build_faiss_index(embeddings):
    """
    Builds a FAISS index for the provided embeddings to enable efficient
    similarity search.
    Args:
        embeddings (numpy.ndarray): The embeddings to be indexed.
    Returns:
        faiss.IndexFlatIP: A FAISS index for performing similarity search.
    """
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)  # Inner Product for cosine similarity
    index.add(embeddings)
    return index


def recommend_universities(student_embeddings, university_index, 
                           universities_df, students_df, top_k=5):
    """
    Recommends universities for each student based on cosine similarity of
    their features.
    Args:
        student_embeddings (numpy.ndarray): The embeddings of students.
        university_index (faiss.IndexFlatIP): The FAISS index for university
        embeddings.
        universities_df (DataFrame): The universities dataset.
        students_df (DataFrame): The students dataset.
        top_k (int, optional): The number of top recommended universities to
        return for each student. Default is 5.
    Returns:
        dict: A dictionary where keys are university names, and values are
        lists of student recommendations.
    """
    recommendations = {}
    for student_embedding, (_, student) in zip(student_embeddings, students_df
                                               .iterrows()):
        distances, indices = university_index.search(np.array([
            student_embedding]), top_k)
        for dist, idx in zip(distances[0], indices[0]):
            university_name = universities_df.iloc[idx]['Name']
            university_country = universities_df.iloc[idx]['Country']
            if university_country == student['Country of Residence']:
                if university_name not in recommendations:
                    recommendations[university_name] = []
                recommendations[university_name].append({
                        "student_name": student['First Name'] + " " + student['Last Name'],
                        "similarity_score": dist
                    })

    return recommendations
