import os
from django.conf import settings
from core.models import Set, Question, Answer, Quiz, Test, TestAnswer
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain.schema import Document

def get_embeddings():
    return GoogleGenerativeAIEmbeddings(model="models/embedding-001")

def get_llm():
    return ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.7)

def setup_vector_store(set_id):
    persist_directory = os.path.join(settings.BASE_DIR, "chroma_db", str(set_id))
    return Chroma(
        persist_directory=persist_directory,
        embedding_function=get_embeddings()
    )

def ingest_set(set_id, user=None):
    try:
        set_obj = Set.objects.get(id=set_id)
        documents = []
        
        questions = Question.objects.filter(set=set_obj, is_deleted=False).prefetch_related("answers")
        for q in questions:
            correct_answers = [a.content for a in q.answers.all() if a.is_correct]
            content = f"Material - Question: {q.title}\nCorrect Answer: {', '.join(correct_answers)}"
            documents.append(Document(page_content=content, metadata={"type": "material", "id": q.id}))
            
        quizzes = Quiz.objects.filter(set=set_obj)
        for quiz in quizzes:
            content = f"Quiz Title: {quiz.title}\nQuestions Count: {quiz.question_count}"
            documents.append(Document(page_content=content, metadata={"type": "quiz", "id": quiz.id}))
            
            tests = Test.objects.filter(quiz=quiz)
            if user:
                tests = tests.filter(user=user)
                
            for test in tests:
                test_content = f"User Performance - Quiz: {quiz.title}\nScore: {test.score}\nStatus: {test.status}\nSubmitted At: {test.submitted_at}"
                documents.append(Document(page_content=test_content, metadata={"type": "test", "id": test.id}))
                
                answers = TestAnswer.objects.filter(test=test).select_related("quiz_question")
                for ans in answers:
                    ans_status = "Correct" if ans.is_correct else "Incorrect"
                    ans_content = f"Performance Detail - Question: {ans.quiz_question.title}\nUser Answer Status: {ans_status}"
                    documents.append(Document(page_content=ans_content, metadata={"type": "performance_detail", "id": ans.id}))

        if not documents:
            return False
            
        vector_store = setup_vector_store(set_id)
        vector_store.add_documents(documents)
        return True
    except Set.DoesNotExist:
        return False

def get_answer(query, set_id):
    vector_store = setup_vector_store(set_id)
    llm = get_llm()
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vector_store.as_retriever(search_kwargs={"k": 5})
    )
    response = qa_chain.invoke(query)
    return response["result"]
