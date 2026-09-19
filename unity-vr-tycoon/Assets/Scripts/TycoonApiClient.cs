using System;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

[Serializable] public class TycoonAction { public string type; public string role; public float value; }
[Serializable] public class TycoonEnvelope { public string error; public TycoonState state; }
[Serializable] public class TycoonState { public int version; public int day; public float cash; public float reputation; public float quality; public float morale; public int inventory; public int branches; }

public class TycoonApiClient : MonoBehaviour
{
    [SerializeField] private string baseUrl = "http://localhost:8080/api";
    [SerializeField] private string bearerToken;
    [SerializeField] private string gameId;
    public TycoonState CurrentState { get; private set; }
    public event Action<TycoonState> StateChanged;

    public void Configure(string token, string id) { bearerToken = token; gameId = id; }

    public async Task<bool> SendAction(string type, string role = null, float value = 0f)
    {
        var action = new TycoonAction { type = type, role = role, value = value };
        var request = new UnityWebRequest($"{baseUrl}/games/{gameId}/actions", "POST");
        var body = Encoding.UTF8.GetBytes(JsonUtility.ToJson(action));
        request.uploadHandler = new UploadHandlerRaw(body);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        request.SetRequestHeader("Authorization", $"Bearer {bearerToken}");
        await request.SendWebRequest();
        if (request.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError($"Tycoon API rejected action: {request.error}");
            return false;
        }
        var envelope = JsonUtility.FromJson<TycoonEnvelope>(request.downloadHandler.text);
        CurrentState = envelope.state;
        StateChanged?.Invoke(CurrentState);
        return true;
    }
}
