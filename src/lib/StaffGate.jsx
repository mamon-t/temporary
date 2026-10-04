import { RequireAuth } from "@/lib/RequireAuth.jsx";

// Персонал панели: владелец и его команда — сразу; остальные — по ролям
// «админ» / «менеджер», которые владелец назначает во вкладке «Пользователи»
// в панели приложения. Вложенные гейты дают «ИЛИ» (один access словом нельзя).
export function StaffGate({ children }) {
  return (
    <RequireAuth
      access="owner"
      fallback={
        <RequireAuth
          access="admin"
          fallback={<RequireAuth access="manager">{children}</RequireAuth>}
        >
          {children}
        </RequireAuth>
      }
    >
      {children}
    </RequireAuth>
  );
}
