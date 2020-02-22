"use strict";

const denyAllPolicy = () => ({
  principalId: "*",
  policyDocument: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "*",
        Effect: "Deny",
        Resource: "*",
      },
    ],
  },
});

const allowPolicy = methodArn => ({
  principalId: "apigateway.amazonaws.com",
  policyDocument: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: "Allow",
        Resource: methodArn,
      },
    ],
  },
});

exports.handler = async event => {
  if (event.authorizationToken === "OK") return allowPolicy(event.methodArn);
  else return denyAllPolicy();
};
