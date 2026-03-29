const axios = require("axios");

async function test() {
  try {
    // 1. send otp
    await axios.post("http://192.168.1.111:5020/api/auth/send-phone-otp", { phone: "9999999999" });
    
    // 2. login
    const res = await axios.post("http://192.168.1.111:5020/api/auth/login-with-otp", { phone: "9999999999", otp: "123456" });
    const token = res.data.access;
    
    // 3. edit profile
    const editPayload = {
      name: "Test",
      onboarding: {
        completed: false,
        step: 2,
      },
      profile: {
        dateOfBirth: new Date().toISOString(), // Use valid ISO
        gender: "Male",
        weight: 70,
        conditions: [],
      },
      languages: [],
      preferences: { reminderTimes: [], soundEnabled: true, vibrationEnabled: true, shareActivityWithCaregiver: true },
      caregivers: [],
    };
    
    const editReq = await axios.put("http://192.168.1.111:5020/api/auth/edit-profile", editPayload, { headers: { Authorization: `Bearer ${token}` }});
    console.log("Success!", editReq.data);

  } catch (err) {
    console.error("ERROR:");
    console.error(err?.response?.data || err.message);
  }
}
test();
