using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit;

public class XRBusinessInteraction : MonoBehaviour
{
    [SerializeField] private TycoonApiClient api;
    [SerializeField] private string actionType = "next-day";
    [SerializeField] private string role;
    [SerializeField] private float value;
    [SerializeField] private XRBaseInteractable interactable;

    private void Awake()
    {
        if (interactable == null) interactable = GetComponent<XRBaseInteractable>();
        interactable.selectEntered.AddListener(_ => Execute());
    }

    private async void Execute()
    {
        if (api == null) return;
        await api.SendAction(actionType, role, value);
    }

    private void OnDestroy()
    {
        if (interactable != null) interactable.selectEntered.RemoveListener(_ => Execute());
    }
}
