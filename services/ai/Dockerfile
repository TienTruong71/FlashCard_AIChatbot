# pull official base image
FROM python:3.12-slim

ENV APP_HOME=/usr/src/service
RUN mkdir $APP_HOME
RUN mkdir $APP_HOME/app
RUN mkdir $APP_HOME/core
RUN mkdir $APP_HOME/apis

# set work directory
WORKDIR /usr/src/service

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV POETRY_VIRTUALENVS_CREATE=False
ENV TZ=Asia/Ho_Chi_Minh

# install psycopg2 dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    default-libmysqlclient-dev \
    libpq-dev \
    python3-dev \
    vim \
    tzdata \
    pkg-config \
    netcat-traditional && \
    rm -rf /var/lib/apt/lists/*

# for sql server 
# Add Microsoft’s APT repository for ODBC driver
# RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
#     && curl https://packages.microsoft.com/config/debian/10/prod.list > /etc/apt/sources.list.d/mssql-prod.list \
#     && apt-get update

# Install the Microsoft ODBC Driver 17 for SQL Server
# RUN ACCEPT_EULA=Y apt-get install -y msodbcsql17

# install dependencies
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

COPY ./poetry.lock ./pyproject.toml ./
RUN touch README.md && poetry install --no-interaction --no-ansi --no-root

# copy folder
COPY . $APP_HOME

