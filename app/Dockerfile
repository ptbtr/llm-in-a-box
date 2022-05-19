FROM python:3.9-bullseye AS base

COPY requirements.txt .
RUN python -m venv /venv && /venv/bin/python -m pip install -r requirements.txt

####################
FROM python:3.9-bullseye AS dev

WORKDIR /src
COPY --from=base /venv /venv

ENV FLASK_APP=server
ENV FLASK_ENV=development
# Set the Huggingface cache to a volume.
ENV TRANSFORMERS_CACHE="/transformers-cache"
ENTRYPOINT ["/venv/bin/python", "-m", "flask", "run", "--host=0.0.0.0", "--port=8000"]

####################
FROM python:3.9-bullseye as prod

WORKDIR /src
COPY --from=base /venv /venv
COPY server/ ./server

ENV FLASK_APP=server

# Set the Huggingface cache to a volume.
ENV TRANSFORMERS_CACHE="/transformers-cache"
ENTRYPOINT ["/venv/bin/python", "-m", "flask", "run", "--host=0.0.0.0", "--port=8000"]
