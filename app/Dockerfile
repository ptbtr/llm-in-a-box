FROM python:3.9-bullseye as base

RUN apt-get update && apt-get install dumb-init

COPY requirements.txt .
RUN python -m venv /venv && /venv/bin/python -m pip install -r requirements.txt

####################
FROM python:3.9-bullseye AS dev

RUN useradd app
USER app

WORKDIR /src
COPY --from=base --chown=app:app /venv /venv
COPY --from=base --chown=app:app /usr/bin/dumb-init /usr/bin/dumb-init

ENV TRANSFORMERS_CACHE="/transformers-cache"
ENTRYPOINT ["dumb-init"]

####################
FROM python:3.9-bullseye as prod

RUN useradd app
USER app

WORKDIR /src
COPY --from=base --chown=app:app /venv /venv
COPY --from=base --chown=app:app /usr/bin/dumb-init /usr/bin/dumb-init
COPY --chown=app:app server/ ./server
COPY --chown=app:app worker/ ./worker

ENV TRANSFORMERS_CACHE="/transformers-cache"
ENTRYPOINT ["dumb-init"]
