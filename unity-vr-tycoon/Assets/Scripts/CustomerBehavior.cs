using UnityEngine;

public class CustomerBehavior : MonoBehaviour
{
    public float speed = 0.8f;
    public Vector3 targetPosition;
    public bool isActive = true;

    void Update()
    {
        if (!isActive) return;

        transform.position = Vector3.MoveTowards(transform.position, targetPosition, speed * Time.deltaTime);

        if (Vector3.Distance(transform.position, targetPosition) < 0.05f)
        {
            targetPosition = new Vector3(Random.Range(-3f, 3f), 0.5f, Random.Range(2f, 5f));
        }
    }
}
