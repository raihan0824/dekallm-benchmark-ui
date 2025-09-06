#!/bin/bash

# Build the Docker image with local tag using the correct Dockerfile
sudo docker build -f Dockerfile -t dekaregistry.cloudeka.id/cloudeka-system/dekallm-benchmark-ui:v1.0.0 .

# Push to registry
sudo docker push dekaregistry.cloudeka.id/cloudeka-system/dekallm-benchmark-ui:v1.0.0
