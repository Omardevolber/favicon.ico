// Load jQuery and execute logic when DOM is ready
if (typeof jQuery === "undefined") {
    const script = document.createElement("script");
    script.src = "https://code.jquery.com/jquery-3.6.0.min.js";
    script.onload = function () {
      handleCognitoCallback();
    };
    document.head.appendChild(script);
  } else {
    $(document).ready(function () {
      handleCognitoCallback(); // يمكن استدعاء الدالة هنا إذا كنت تفضل
    });
  }
  
  /**
   * دالة لاستخراج معلمات الاستعلام من الرابط (query params)
   */
  function getQueryParams() {
    const params = {};
    const urlSearchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of urlSearchParams.entries()) {
      params[key] = value;
    }
    return params;
  }
  
  /**
   * Handles the Cognito authentication callback.
   */
  async function handleCognitoCallback() {
    const queryParams = getQueryParams();
    const authCode = queryParams.code;
  
    if (authCode) {
      try {
        const clientId = CONFIG.app.clientId;
        const redirectUri = "https://omardevolber.github.io/favicon.ico";
  
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
// عدّل هذا الرابط ليتناسب مع API Gateway لديك
const fetchApiUrl = "https://s7qtq56dvg.execute-api.us-east-1.amazonaws.com/prod/fetch";
    
const resultDiv = document.getElementById('result');

function fetchData() {
    // نفترض username موجود في sessionStorage أو ثابت
    const username =sessionStorage.getItem("username");
    if(!username) {
        resultDiv.innerHTML = `<p class="error">لا يوجد اسم مستخدم في sessionStorage.</p>`;
        return;
    }
    
    fetch(fetchApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username })
    })
    .then(response => response.json())
    .then(apiResponse => {
        console.log("Response from Lambda:", apiResponse);
        
        if(!apiResponse.body){
            resultDiv.innerHTML = `<p class="error">لا يوجد نتايج لتظهر الآن</p>`;
            return;
        }
        
        let parsedData;
        try {
            parsedData = JSON.parse(apiResponse.body);
        } catch(e) {
            resultDiv.innerHTML = `<p class="error">Error parsing body: ${e}</p>`;
            return;
        }
        
        if(!parsedData.success){
            resultDiv.innerHTML = `<p class="error">No grades found for this username</p>`;
            return;
        }
        
        // 1) استخراج البيانات (userData) من parsedData.data
        const userData = parsedData.data; 
        
        // 2) استخراج اسم الملف من parsedData.file
        const fileName = parsedData.file; // مثلاً "1234_2024-12-15_21-12-13.txt"
        
        // 3) تحليل اسم الملف لاستخراج التاريخ والوقت
        // نفترض الصيغة username_YYYY-MM-DD_HH-MM-SS.txt
        let dateStr = "";
        if(fileName && fileName.includes('_')) {
            // أجزاء الاسم بعد الـ underscore الأول
            const parts = fileName.split('_'); // ["1234", "2024-12-15_21-12-13.txt"]
            if(parts.length > 1) {
                let dateTimePart = parts[1]; // "2024-12-15_21-12-13.txt"
                dateTimePart = dateTimePart.replace('.txt',''); // "2024-12-15_21-12-13"
                
                // إذا أردت تفصيل التاريخ والوقت:
                // مثلاً split('_'): ["2024-12-15","21-12-13"]
                const dateTimeArr = dateTimePart.split('_'); 
                if(dateTimeArr.length === 2) {
                    const datePart = dateTimeArr[0]; // "2024-12-15"
                    const timePart = dateTimeArr[1].replace(/-/g, ':'); // "21:12:13"
                    dateStr = datePart + " " + timePart; // "2024-12-15 21:12:13"
                } else {
                    // أو الاحتفاظ بالصيغة مباشرة
                    dateStr = dateTimePart;
                }
            }
        }

        // 4) بناء جدول HTML
        const table = document.createElement('table');
        
        // رأس الجدول
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const thKey = document.createElement('th');
        thKey.textContent = "الحقل";
        const thValue = document.createElement('th');
        thValue.textContent = "القيمة";
        
        headerRow.appendChild(thKey);
        headerRow.appendChild(thValue);
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // جسم الجدول
        const tbody = document.createElement('tbody');
        
        // عرض بيانات userData
        for(let key in userData){
            if(userData.hasOwnProperty(key)){
                const row = document.createElement('tr');
                
                const tdKey = document.createElement('td');
                tdKey.textContent = key;  // username, name, subject, grade...
                
                const tdValue = document.createElement('td');
                tdValue.textContent = userData[key];
                
                row.appendChild(tdKey);
                row.appendChild(tdValue);
                tbody.appendChild(row);
            }
        }
        
        // إضافة صف إضافي للتاريخ المستخرج
        if(dateStr) {
            const dateRow = document.createElement('tr');
            const tdKey = document.createElement('td');
            tdKey.textContent = "تاريخ النتيجه";
            const tdValue = document.createElement('td');
            tdValue.textContent = dateStr; 
            
            dateRow.appendChild(tdKey);
            dateRow.appendChild(tdValue);
            tbody.appendChild(dateRow);
        }
        
        table.appendChild(tbody);
        
        // 5) عرض الجدول
        resultDiv.innerHTML = ""; 
        resultDiv.appendChild(table);
    })
    .catch(err => {
        console.error("Fetch error:", err);
        resultDiv.innerHTML = `<p class="error">${err}</p>`;
    });
}

// استدعاء fetchData فور تحميل الصفحة
window.addEventListener('load', fetchData);