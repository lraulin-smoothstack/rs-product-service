"use strict";

const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const axios = require("axios");

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

const getEncodedToken = header => header.split(" ")[1];

// const getJwkByKid = async (iss, kid) => {
//   const jwksendpoint = iss + "/.well-known/jwks.json";
//   const json = await axios(jwksendpoint);

//   for (let index = 0; index < json.data.keys.length; index++) {
//     const key = json.data.keys[index];

//     if (key.kid === kid) return key;
//   }
// };

const getMethod = arn => arn.split("/")[2];

const getResource = arn =>
  arn
    .split("/")
    .slice(3)
    .join("/");

exports.handler = async event => {
  console.log("<><><> HEY! From authorizer handler! <><><>");
  console.log(JSON.stringify(event));
  try {
    const encodedToken = getEncodedToken(event.authorizationToken);
    const token = jwt.decode(encodedToken, { complete: true });
    // const jwk = await getJwkByKid(token.payload.iss, token.header.kid);
    // const pem = jwkToPem(jwk);
    // jwt.verify(encodedToken, pem);
    const role = token.payload.role;
    console.log("ROLE: " + role);
    const method = getMethod(event.methodArn);
    console.log("METHOD: " + method);
    const resource = getResource;
    console.log("RESOURCE: " + resource);

    /**
     * TODO: logic for resource access by role
     */

    return allowPolicy(event.methodArn);
  } catch (error) {
    console.log("^^^ Authorization Error ^^^");
    console.error(error.message);
    return denyAllPolicy();
  }
};
