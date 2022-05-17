FROM python:3.9-bullseye

WORKDIR /src

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY server/ ./server

ENV FLASK_APP="server"
# Set the Huggingface cache to a volume.
ENV TRANSFORMERS_CACHE="/transformers-cache"
ENTRYPOINT ["flask", "run", "--host=0.0.0.0", "--port=8000"]
