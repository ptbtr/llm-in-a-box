FROM python:3.10-bullseye as base

ARG NVIDIA_URL=https://developer.download.nvidia.com/compute/cuda/repos

RUN apt-get update && apt-get install -y \
	dumb-init \
	software-properties-common

# Install CUDA.
#
# https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#debian-installation
RUN add-apt-repository contrib \
	&& apt-key del 7fa2af80 \
	&& wget ${NVIDIA_URL}/debian11/x86_64/cuda-keyring_1.0-1_all.deb \
	&& dpkg -i cuda-keyring_1.0-1_all.deb \
	&& apt-get update \
	&& apt-get install -y cuda

COPY requirements.txt .
RUN --mount=type=cache,mode=0777,target=/root/.cache \
	python -m venv /venv \
	&& /venv/bin/python -m pip install -r requirements.txt

####################
FROM python:3.10-bullseye AS dev

WORKDIR /src

RUN useradd app
RUN mkdir /transformers-cache && chown app:app /transformers-cache
USER app

COPY --from=base --chown=app:app /venv /venv
COPY --from=base /usr/local/cuda-11.7 /usr/local/cuda-11.7
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init

COPY dev-requirements.txt .
RUN /venv/bin/python -m pip install -r dev-requirements.txt

ENV PATH=/usr/local/cuda-11.7/bin:/venv/bin:$PATH
ENV LD_LIBRARY_PATH=/usr/local/cuda-11.7/lib64:$LD_LIBRARY_PATH
ENV TRANSFORMERS_CACHE="/transformers-cache"
ENTRYPOINT ["dumb-init"]

####################
FROM python:3.10-bullseye as prod

WORKDIR /src

RUN useradd app
USER app

COPY --from=base --chown=app:app /venv /venv
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=base /usr/local/cuda-11.7 /usr/local/cuda-11.7
COPY --chown=app:app server/ ./server
COPY --chown=app:app worker/ ./worker
COPY --chown=app:app settings/ ./settings

ENV PATH=/usr/local/cuda-11.7/bin:/venv/bin:$PATH
ENV LD_LIBRARY_PATH=/usr/local/cuda-11.7/lib64:$LD_LIBRARY_PATH
ENV TRANSFORMERS_CACHE="/transformers-cache"
ENTRYPOINT ["dumb-init"]
