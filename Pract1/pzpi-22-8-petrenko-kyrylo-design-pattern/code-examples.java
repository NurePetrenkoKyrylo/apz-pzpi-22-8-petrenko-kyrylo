// Інтерфейс Prototype визначає метод клонування
interface Prototype {
    Prototype clone();
}

// Клас Medicine реалізує Prototype
class Medicine implements Prototype {
    private String name;
    private String manufacturer;
    private double price;

    public Medicine(String name, String manufacturer, double price) {
        this.name = name;
        this.manufacturer = manufacturer;
        this.price = price;
    }

    // Метод клонування створює нову копію об'єкта
    @Override
    public Prototype clone() {
        return new Medicine(this.name, this.manufacturer, this.price);
    }

    // Метод для зміни ціни
    public void setPrice(double newPrice) {
        this.price = newPrice;
    }

    // Виведення інформації про ліки
    public void display() {
        System.out.println("Назва: " + name +
                           ", Виробник: " + manufacturer +
                           ", Ціна: " + price + " грн");
    }
}

// Головний клас демонструє використання патерна
public class Main {
    public static void main(String[] args) {
        // Створення оригінального об'єкта
        Medicine original = new Medicine("Парацетамол", "HealthCorp", 37.5);

        // Клонування об'єкта
        Medicine copy = (Medicine) original.clone();

        // Зміна ціни в копії, щоб показати незалежність об'єктів
        copy.setPrice(42.0);

        // Виведення обох об'єктів
        System.out.println("=== Оригінал ===");
        original.display();

        System.out.println("=== Копія ===");
        copy.display();
    }
}
