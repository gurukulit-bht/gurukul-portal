import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { inventoryTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

function mapItem(i: typeof inventoryTable.$inferSelect) {
  return {
    id: i.id,
    name: i.name,
    category: i.category,
    dateProcured: i.dateProcured ?? "",
    quantityProcured: i.quantityProcured,
    currentStock: i.currentStock,
    reorderLevel: i.reorderLevel,
    lastReplenishment: i.lastReplenishment ?? "",
    vendor: i.vendor ?? "",
    remarks: i.remarks ?? "",
  };
}

// GET /api/admin/inventory
router.get("/", async (req, res) => {
  try {
    const items = await db.select().from(inventoryTable).orderBy(asc(inventoryTable.id));
    res.json(items.map(mapItem));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch inventory");
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// POST /api/admin/inventory
router.post("/", async (req, res) => {
  try {
    const { name, category, dateProcured, quantityProcured, currentStock, reorderLevel, vendor, remarks } = req.body;
    const [item] = await db
      .insert(inventoryTable)
      .values({
        name,
        category,
        dateProcured: dateProcured || null,
        quantityProcured: parseInt(quantityProcured) || 0,
        currentStock: parseInt(currentStock) || 0,
        reorderLevel: parseInt(reorderLevel) || 5,
        vendor: vendor || null,
        remarks: remarks || null,
        lastReplenishment: dateProcured || null,
      })
      .returning();
    res.json(mapItem(item));
  } catch (err) {
    req.log.error({ err }, "Failed to create inventory item");
    res.status(500).json({ error: "Failed to create inventory item" });
  }
});

// PUT /api/admin/inventory/:id
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, category, dateProcured, quantityProcured, currentStock, reorderLevel, lastReplenishment, vendor, remarks } = req.body;
    const [item] = await db
      .update(inventoryTable)
      .set({
        name,
        category,
        dateProcured: dateProcured || null,
        quantityProcured: parseInt(quantityProcured) || 0,
        currentStock: parseInt(currentStock) || 0,
        reorderLevel: parseInt(reorderLevel) || 5,
        lastReplenishment: lastReplenishment || null,
        vendor: vendor || null,
        remarks: remarks || null,
      })
      .where(eq(inventoryTable.id, id))
      .returning();
    res.json(mapItem(item));
  } catch (err) {
    req.log.error({ err }, "Failed to update inventory item");
    res.status(500).json({ error: "Failed to update inventory item" });
  }
});

// PATCH /api/admin/inventory/:id/replenish
router.patch("/:id/replenish", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    const [current] = await db.select().from(inventoryTable).where(eq(inventoryTable.id, id));
    if (!current) return res.status(404).json({ error: "Not found" });

    const [item] = await db
      .update(inventoryTable)
      .set({
        currentStock: current.currentStock + parseInt(quantity),
        lastReplenishment: new Date().toISOString().split("T")[0],
      })
      .where(eq(inventoryTable.id, id))
      .returning();
    res.json(mapItem(item));
  } catch (err) {
    req.log.error({ err }, "Failed to replenish inventory item");
    res.status(500).json({ error: "Failed to replenish inventory item" });
  }
});

// DELETE /api/admin/inventory/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(inventoryTable).where(eq(inventoryTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete inventory item");
    res.status(500).json({ error: "Failed to delete inventory item" });
  }
});

export default router;
