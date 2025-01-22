# src/__init__.py
from .data_loader import load_data
from .preprocessing import preprocess_data
from .model import generate_embeddings, build_faiss_index, recommend_universities
