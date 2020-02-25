
#!/bin/bash

# Create
aws cloudformation create-stack --stack-name rsproductstack --template-body file://stack.yml
