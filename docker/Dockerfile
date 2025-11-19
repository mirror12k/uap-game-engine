FROM ubuntu:24.04

WORKDIR /app

ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y gnupg software-properties-common curl python3-pip \
  nano jq zip make openssh-client \
  && apt autoclean && apt autoremove && apt clean

ENV NVM_DIR /bin/nvm
RUN mkdir -p $NVM_DIR
ENV NODE_VERSION v22.12.0
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm use --delete-prefix $NODE_VERSION"
ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/$NODE_VERSION/bin:$PATH
RUN npm install -g @anthropic-ai/claude-code

# safety measure to drop privileges to lowly user
RUN useradd -ms /bin/bash runuser
USER runuser

CMD bash
