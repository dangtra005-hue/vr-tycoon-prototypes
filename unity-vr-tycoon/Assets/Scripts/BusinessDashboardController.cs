using UnityEngine;

public class BusinessDashboardController : MonoBehaviour
{
    public BusinessTycoonManager tycoon;

    public TMPro.TextMeshProUGUI moneyText;
    public TMPro.TextMeshProUGUI reputationText;
    public TMPro.TextMeshProUGUI staffText;
    public TMPro.TextMeshProUGUI priceText;
    public TMPro.TextMeshProUGUI qualityText;
    public TMPro.TextMeshProUGUI inventoryText;
    public TMPro.TextMeshProUGUI demandText;
    public TMPro.TextMeshProUGUI revenueText;
    public TMPro.TextMeshProUGUI expenseText;
    public TMPro.TextMeshProUGUI profitText;
    public TMPro.TextMeshProUGUI dayText;

    void Update()
    {
        if (tycoon == null) return;

        moneyText.text = "$" + tycoon.money.ToString("N0");
        reputationText.text = tycoon.reputation.ToString("F0") + "%";
        staffText.text = tycoon.staff.ToString();
        priceText.text = "$" + tycoon.price.ToString("F0");
        qualityText.text = tycoon.quality.ToString("F0") + "%";
        inventoryText.text = tycoon.inventory.ToString();
        demandText.text = tycoon.demand.ToString("F2");
        revenueText.text = "$" + tycoon.revenue.ToString("N0");
        expenseText.text = "$" + tycoon.expenses.ToString("N0");
        profitText.text = "$" + tycoon.totalProfit.ToString("N0");
        dayText.text = "Day " + tycoon.day;
    }
}
