using System;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

[Serializable] public class AuthPayload { public string email; public string password; }
[Serializable] public class AuthResponse { public string accessToken; public AuthUser user; }
[Serializable] public class AuthUser { public string id; public string email; }

public class TycoonSession : MonoBehaviour
{
    [SerializeField] private string baseUrl = "https://localhost:8080/api";
    public string AccessToken { get; private set; }
    public string UserId { get; private set; }
    public bool IsAuthenticated => !string.IsNullOrEmpty(AccessToken);

    public async Task<bool> Login(string email, string password)
    {
        return await SendAuth("/auth/login", email, password);
    }

    public async Task<bool> Register(string email, string password)
    {
        return await SendAuth("/auth/register", email, password);
    }

    public async Task Logout()
    {
        var request = new UnityWebRequest($"{baseUrl}/auth/logout", "POST") { uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes("{}")), downloadHandler = new DownloadHandlerBuffer() };
        request.SetRequestHeader("Content-Type", "application/json");
        await request.SendWebRequest();
        AccessToken = null;
        UserId = null;
    }

    private async Task<bool> SendAuth(string endpoint, string email, string password)
    {
        var body = Encoding.UTF8.GetBytes(JsonUtility.ToJson(new AuthPayload { email = email, password = password }));
        var request = new UnityWebRequest(baseUrl + endpoint, "POST") { uploadHandler = new UploadHandlerRaw(body), downloadHandler = new DownloadHandlerBuffer() };
        request.SetRequestHeader("Content-Type", "application/json");
        await request.SendWebRequest();
        if (request.result != UnityWebRequest.Result.Success) { Debug.LogError(request.downloadHandler.text); return false; }
        var result = JsonUtility.FromJson<AuthResponse>(request.downloadHandler.text);
        AccessToken = result.accessToken;
        UserId = result.user.id;
        return true;
    }
}
