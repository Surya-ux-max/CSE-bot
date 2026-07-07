import os

from dotenv import load_dotenv

from fastapi import FastAPI
from pydantic import BaseModel

from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

from langchain_groq import ChatGroq


