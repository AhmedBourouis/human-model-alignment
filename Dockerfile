# syntax=docker/dockerfile:1

FROM python:3.8-slim-buster

WORKDIR /ahmed-bourouis-web-interface-docker/

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY . .
CMD python3 -m flask  --app backend/app.py run --host=0.0.0.0