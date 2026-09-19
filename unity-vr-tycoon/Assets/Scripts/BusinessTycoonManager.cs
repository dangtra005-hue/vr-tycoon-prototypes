using UnityEngine;
using UnityEngine.XR;
using UnityEngine.XR.Interaction.Toolkit;

public class BusinessTycoonManager : MonoBehaviour
{
    [Header("Business State")]
    public float money = 7500f;
    public int staff = 1;
    public float reputation = 55f;
    public float price = 25f;
    public float quality = 65f;
    public int inventory = 18;
    public int upgradeLevel = 1;
    public int day = 1;
    public float demand = 0.6f;
    public float revenue = 0f;
    public float expenses = 0f;
    public float totalProfit = 0f;

    [Header("References")]
    public Transform customerSpot;
    public Transform cashierDesk;
    public GameObject[] staffMarkers;

    private float tickTimer = 0f;

    void Update()
    {
        tickTimer += Time.deltaTime;
        if (tickTimer >= 5f)
        {
            tickTimer = 0f;
            AdvanceBusinessDay();
        }
    }

    public void AdvanceBusinessDay()
    {
        float marketBoost = 1f + (Mathf.Sin(day * 0.7f) * 0.16f);
        float priceFactor = Mathf.Clamp(1.3f - (price / 100f), 0.35f, 1.3f);
        float serviceFactor = Mathf.Clamp(0.75f + staff * 0.15f + quality / 120f, 0.45f, 1.7f);

        demand = Mathf.Clamp((0.6f + reputation / 150f + Mathf.Sin(day * 0.5f) * 0.1f) * marketBoost * priceFactor * serviceFactor, 0.2f, 1.8f);

        int soldUnits = Mathf.Clamp(Mathf.FloorToInt(demand * (18 + staff * 12) * (1f + upgradeLevel * 0.18f)), 0, inventory + 20);
        revenue = soldUnits * price;

        float staffCost = staff * 210f;
        float utilityCost = 120f + upgradeLevel * 45f;
        float maintenance = 45f + upgradeLevel * 20f;
        expenses = staffCost + utilityCost + maintenance;

        float profit = revenue - expenses;
        money += profit;
        totalProfit += profit;
        reputation = Mathf.Clamp(reputation + (profit > 0 ? 0.9f : -1.2f) + quality / 100f - price / 220f, 0f, 100f);
        quality = Mathf.Clamp(quality + (upgradeLevel > 1 ? 0.6f : 0f), 30f, 100f);

        inventory = Mathf.Max(0, inventory - soldUnits + Mathf.RoundToInt(staff * 0.8f));
        day += 1;
    }

    public void HireStaff()
    {
        if (money < 650f)
        {
            Debug.Log("Not enough cash to hire staff.");
            return;
        }

        money -= 650f;
        staff += 1;
        UpdateStaffMarkers();
    }

    public void BuyUpgrade()
    {
        float cost = 1400f + upgradeLevel * 650f;
        if (money < cost)
        {
            Debug.Log("Not enough cash for upgrade.");
            return;
        }

        money -= cost;
        upgradeLevel += 1;
        quality = Mathf.Clamp(quality + 8f, 0f, 100f);
    }

    public void RestockInventory()
    {
        int cost = 200 + inventory * 12;
        if (money < cost)
        {
            Debug.Log("Not enough cash to restock.");
            return;
        }

        money -= cost;
        inventory += 18;
    }

    public void IncreasePrice()
    {
        price += 5f;
    }

    public void LowerPrice()
    {
        price = Mathf.Max(10f, price - 5f);
    }

    private void UpdateStaffMarkers()
    {
        for (int i = 0; i < staffMarkers.Length; i++)
        {
            staffMarkers[i].SetActive(i < staff);
        }
    }
}
