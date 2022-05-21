FROM python:3.10-bullseye as base

RUN apt-get update && apt-get install dumb-init

COPY requirements.txt .
RUN python -m venv /venv && /venv/bin/python -m pip install -r requirements.txt

####################
FROM python:3.10-bullseye AS dev

WORKDIR /src

RUN useradd app
RUN mkdir /transformers-cache && chown app:app /transformers-cache
USER app

COPY --from=base --chown=app:app /venv /venv
COPY --from=base --chown=app:app /usr/bin/dumb-init /usr/bin/dumb-init

COPY dev-requirements.txt .
RUN /venv/bin/python -m pip install -r dev-requirements.txt

ENV TRANSFORMERS_CACHE="/transformers-cache"
ENTRYPOINT ["dumb-init"]

####################
FROM python:3.10-bullseye as prod

WORKDIR /src

RUN useradd app
USER app

COPY --from=base --chown=app:app /venv /venv
COPY --from=base --chown=app:app /usr/bin/dumb-init /usr/bin/dumb-init
COPY --chown=app:app server/ ./server
COPY --chown=app:app worker/ ./worker
COPY --chown=app:app settings/ ./settings

ENV TRANSFORMERS_CACHE="/transformers-cache"
ENTRYPOINT ["dumb-init"]
