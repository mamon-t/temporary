import Home from "@/pages/Home.jsx";
import Clients from "@/pages/Clients.jsx";
import ClientDetail from "@/pages/ClientDetail.jsx";
import Products from "@/pages/Products.jsx";
import ProductDetail from "@/pages/ProductDetail.jsx";
import Orders from "@/pages/Orders.jsx";
import OrderDetail from "@/pages/OrderDetail.jsx";
import Suppliers from "@/pages/Suppliers.jsx";
import SettingsPage from "@/pages/SettingsPage.jsx";
import AdminLayout from "@/components/AdminLayout.jsx";
import { StaffGate } from "@/lib/StaffGate.jsx";

// Все разделы панели закрыты гейтом персонала: владелец и его команда — сразу,
// остальные — по ролям «админ» / «менеджер» (вкладка «Пользователи»).
// AdminLayout — общий каркас (сайдбар, шапка, «Настройки»); страница рендерится
// внутри него через <Outlet />.
const page = (el) => (
  <StaffGate>
    <AdminLayout>{el}</AdminLayout>
  </StaffGate>
);

export const routes = [
  { path: "/", label: "Дашборд", element: page(<Home />) },
  { path: "/clients", label: "Клиенты", element: page(<Clients />) },
  { path: "/clients/:id", label: "Клиент", element: page(<ClientDetail />) },
  { path: "/products", label: "Товары", element: page(<Products />) },
  { path: "/products/:id", label: "Товар", element: page(<ProductDetail />) },
  { path: "/orders", label: "Заказы", element: page(<Orders />) },
  { path: "/orders/:id", label: "Заказ", element: page(<OrderDetail />) },
  { path: "/suppliers", label: "Поставщики", element: page(<Suppliers />) },
  { path: "/settings", label: "Настройки", element: page(<SettingsPage />) },
];
