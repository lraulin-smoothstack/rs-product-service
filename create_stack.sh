
#!/bin/bash

# Create
aws cloudformation create-stack --stack-name rsproductstack --template-body file://stack.yml --parameters ParameterKey=KeyName,ParameterValue=ss_dec_ec2_key
