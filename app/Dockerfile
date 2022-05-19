FROM python:3.9-bullseye as base

RUN apt-get update && apt-get install dumb-init

COPY requirements.txt .
RUN python -m venv /venv && /venv/bin/python -m pip install -r requirements.txt

####################
FROM python:3.9-bullseye AS dev

WORKDIR /src
COPY --from=base /venv /venv
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init

ENV TRANSFORMERS_CACHE="/transformers-cache"
ENTRYPOINT ["dumb-init"]

####################
FROM python:3.9-bullseye as prod

WORKDIR /src
COPY --from=base /venv /venv
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init
COPY server/ ./server
COPY worker/ ./worker

ENV TRANSFORMERS_CACHE="/transformers-cache"
ENTRYPOINT ["dumb-init"]
