const CONFIG = {
    app: {
      userPoolId: "us-east-1_ANIwHUagf",
      clientId: "27eatr098n0g9ijslehe9djufs",
    },
};
$(document).ready(async function () {
    //test here

    // استدعاء الدالة handleCognitoCallback وانتظار اكتمالها
    await handleCognitoCallback();
    
   
   
  });

  /**
   * Handles the Cognito authentication callback.
   */
  async function handleCognitoCallback() {
    const queryParams = getQueryParams();
    const authCode = queryParams.code;

    if (authCode) {
      try {
        const clientId = CONFIG.app.clientId;
        const redirectUri = "";

        // Fetch access token using the authorization code
        const tokenResponse = await fetch(
          "https://us-east-1aniwhuagf.auth.us-east-1.amazoncognito.com/oauth2/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `grant_type=authorization_code&client_id=${clientId}&code=${authCode}&redirect_uri=${encodeURIComponent(
              redirectUri
            )}`,
          }
        );

        if (!tokenResponse.ok) {
          throw new Error("Failed to fetch access token.");
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Fetch user information using the access token
        const userInfoResponse = await fetch(
          "https://us-east-1aniwhuagf.auth.us-east-1.amazoncognito.com/oauth2/userInfo",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!userInfoResponse.ok) {
          throw new Error("Failed to fetch user information.");
        }

        const userInfo = await userInfoResponse.json();
        const userId = userInfo.sub;

        // Get the username from userInfo
        const username = userInfo.email || userInfo.username;

        // Store userId and username in sessionStorage
        if (userId) {
          sessionStorage.setItem("userId", userId);
        }

        if (userInfo.username) {
          sessionStorage.setItem("username", userInfo.username);
        }
        // Store name, email, phone_number, etc.
        if (userInfo.name) {
          sessionStorage.setItem("name", userInfo.name);
          
        }
        
        if (userInfo.email) {
          sessionStorage.setItem("email", userInfo.email);
        }

        if (userInfo.phone_number) {
          sessionStorage.setItem("phone_number", userInfo.phone_number);
        }

        // Store the accessToken in sessionStorage
        sessionStorage.setItem("accessToken", accessToken);

        // Initialize the dashboard
        await initializeDashboard();
      } catch (error) {
        console.error("Error handling Cognito callback:", error);
      }
    }
  }
