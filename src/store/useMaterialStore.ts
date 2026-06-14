import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Material, MaterialRequisition } from "@/types";
import { mockMaterials, mockMaterialRequisitions } from "@/mock/data";
import { generateId, getNowISOString } from "@/utils/generators";
import { checkSafetyStock } from "@/utils/validators";

interface MaterialState {
  materials: Material[];
  requisitions: MaterialRequisition[];

  requisitionMaterial: (
    activityId: string,
    materialId: string,
    quantity: number
  ) => { success: boolean; message?: string; warning?: boolean };

  getLowStockMaterials: () => Material[];
  getMaterialById: (id: string) => Material | undefined;
  getRequisitionsByActivity: (activityId: string) => MaterialRequisition[];
  restockMaterial: (materialId: string, quantity: number) => void;
}

export const useMaterialStore = create<MaterialState>()(
  persist(
    (set, get) => ({
      materials: mockMaterials,
      requisitions: mockMaterialRequisitions,

      requisitionMaterial: (activityId, materialId, quantity) => {
        const material = get().materials.find((m) => m.id === materialId);
        if (!material) {
          return { success: false, message: "物资不存在" };
        }
        if (material.currentStock < quantity) {
          return {
            success: false,
            message: `库存不足，当前库存：${material.currentStock}${material.unit}`,
          };
        }

        const requisition: MaterialRequisition = {
          id: generateId(),
          activityId,
          materialId,
          quantity,
          requisitionTime: getNowISOString(),
        };

        const newStock = material.currentStock - quantity;
        const stockCheck = checkSafetyStock(newStock, material.safetyStock);

        set({
          materials: get().materials.map((m) =>
            m.id === materialId
              ? {
                  ...m,
                  currentStock: newStock,
                  warning: stockCheck.isWarning,
                }
              : m
          ),
          requisitions: [...get().requisitions, requisition],
        });

        return {
          success: true,
          warning: stockCheck.isWarning,
          message: stockCheck.isWarning
            ? `领用成功！当前库存已低于安全库存（剩余${newStock}${material.unit}）`
            : "领用成功",
        };
      },

      getLowStockMaterials: () => {
        return get().materials.filter((m) => m.warning);
      },

      getMaterialById: (id) => {
        return get().materials.find((m) => m.id === id);
      },

      getRequisitionsByActivity: (activityId) => {
        return get().requisitions.filter((r) => r.activityId === activityId);
      },

      restockMaterial: (materialId, quantity) => {
        set({
          materials: get().materials.map((m) => {
            if (m.id === materialId) {
              const newStock = m.currentStock + quantity;
              const stockCheck = checkSafetyStock(newStock, m.safetyStock);
              return {
                ...m,
                currentStock: newStock,
                warning: stockCheck.isWarning,
              };
            }
            return m;
          }),
        });
      },
    }),
    {
      name: "volunteer-material-storage",
    }
  )
);
