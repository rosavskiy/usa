import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { CarbonModel } from "../models/carbon.model";
import { asyncHandler } from "../middleware/error.middleware";

export const exportCSV = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const calculations = await CarbonModel.findByUserId(userId);

    // CSV header
    const headers = [
      "ID",
      "Date",
      "Category",
      "Scope",
      "CO2 (kg)",
      "CH4 (kg)",
      "N2O (kg)",
      "Total CO2e (kg)",
      "Period Start",
      "Period End",
    ];

    // CSV rows
    const rows = calculations.map((calc) => [
      calc.id,
      new Date(calc.calculation_date).toLocaleDateString(),
      calc.category,
      calc.emission_type,
      Number(calc.co2_kg).toFixed(3),
      Number(calc.ch4_kg).toFixed(3),
      Number(calc.n2o_kg).toFixed(3),
      Number(calc.total_co2e_kg).toFixed(2),
      calc.period_start ? new Date(calc.period_start).toLocaleDateString() : "",
      calc.period_end ? new Date(calc.period_end).toLocaleDateString() : "",
    ]);

    // Combine
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Send as file
    const filename = `carbon-calculations-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csvContent);
  }
);
