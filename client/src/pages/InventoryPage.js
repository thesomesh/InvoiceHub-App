import React, {
  useState,
  useEffect,
  useMemo,
} from "react";

import { productAPI } from "../services/productAPI";
import api from "../services/api";
const defaultCategories = [
  "General",
];

const defaultUnits = [
  "kg",
  "piece",
  "box",
  "liter",
];
const formatCurrency = (
  value
) =>
  `₹${Number(
    value || 0
  ).toFixed(2)}`;
const InventoryPage = () => {

   const [downloading, setDownloading] = useState(false); 
  const [products, setProducts] =
    useState([]);

  const [summary, setSummary] =
    useState(null);

  const [filters, setFilters] =
    useState({
      search: "",
      category: "All",
      stockStatus: "All",
    });

  const [form, setForm] =
    useState({
      name: "",

      category: "General",

      customCategory: "",

      unit: "kg",

      customUnit: "",

      stock: "",

      costPrice: "",

      sellingPrice: "",
      discountPercentage: "",
finalSellingPrice: "",
minimumStock: 5,
    });

  const [editingId, setEditingId] =
    useState(null);

  // ========================================
  // DYNAMIC CATEGORIES
  // ========================================

  const categoryOptions =
    useMemo(() => {
      const dbCategories =
        products.map(
          (p) => p.category
        );

      return [
        ...new Set([
          ...defaultCategories,
          ...dbCategories,
        ]),
      ];
    }, [products]);

  // ========================================
  // DYNAMIC UNITS
  // ========================================

  const unitOptions =
    useMemo(() => {
      const dbUnits =
        products.map(
          (p) => p.unit
        );

      return [
        ...new Set([
          ...defaultUnits,
          ...dbUnits,
        ]),
      ];
    }, [products]);

  useEffect(() => {
    fetchProducts();

    fetchStats();
  }, []);

  // ========================================
  // FETCH PRODUCTS
  // ========================================

  const fetchProducts =
    async () => {
      try {
        const params = {};

        if (filters.search) {
          params.search =
            filters.search;
        }

        if (
          filters.category !==
          "All"
        ) {
          params.category =
            filters.category;
        }

        if (
          filters.stockStatus !==
          "All"
        ) {
          params.stockStatus =
            filters.stockStatus;
        }

        const res =
          await productAPI.getAll(
            params
          );

        setProducts(
          res.data || []
        );
      } catch (err) {
        console.log(err);
      }
    };

  // ========================================
  // FETCH STATS
  // ========================================

  const fetchStats =
    async () => {
      try {
        const res =
          await productAPI.getStats();

        setSummary(res.data);
      } catch (err) {
        console.log(err);
      }
    };

  // ========================================
  // HANDLE CHANGE
  // ========================================

const handleChange = (e) => {
  const { name, value } = e.target;

  let updated = {
    ...form,
    [name]: value,
  };

  if (
    name === "sellingPrice" ||
    name === "discountPercentage"
  ) {
    const selling =
      Number(
        name === "sellingPrice"
          ? value
          : updated.sellingPrice
      );

    const discount =
      Number(
        name === "discountPercentage"
          ? value
          : updated.discountPercentage
      );

    updated.finalSellingPrice =
      (
        selling -
        (selling * discount) / 100
      ).toFixed(2);
  }

  setForm(updated);
};
const handleFinalSellingPriceChange = (e) => {
  const finalPrice = Number(
    e.target.value || 0
  );

  const originalPrice = Number(
    form.sellingPrice || 0
  );

  let discount = 0;

  if (originalPrice > 0) {
    discount =
      (
        (
          originalPrice -
          finalPrice
        ) / originalPrice
      ) * 100;
  }

  setForm({
    ...form,
    finalSellingPrice: finalPrice,
    discountPercentage:
      discount.toFixed(2),
  });
};
  // ========================================
  // FILTER CHANGE
  // ========================================

  const handleFilterChange = (
    e
  ) => {
    setFilters({
      ...filters,

      [e.target.name]:
        e.target.value,
    });
  };

  // ========================================
  // APPLY FILTERS
  // ========================================

  const applyFilters = () => {
    fetchProducts();
  };

  // ========================================
  // RESET FORM
  // ========================================

  const resetForm = () => {
    setForm({
      name: "",

      category: "General",

      customCategory: "",

      unit: "kg",

      customUnit: "",

      stock: "",

      costPrice: "",

      sellingPrice: "",
      discountPercentage: "",
      minimumStock: 5,
    });

    setEditingId(null);
  };

  // ========================================
  // CALCULATIONS
  // ========================================
const originalSellingPrice =
  Number(
    form.sellingPrice || 0
  );

const discountPercentage =
  Number(
    form.discountPercentage || 0
  );

const finalSellingPrice =
  originalSellingPrice -
  (
    originalSellingPrice *
    discountPercentage
  ) / 100;

const totalValue =
  Number(form.stock || 0) *
  finalSellingPrice;

const profitPerUnit =
  finalSellingPrice -
  Number(form.costPrice || 0);

const expectedProfit =
  profitPerUnit *
  Number(form.stock || 0);
  // ========================================
  // SUBMIT
  // ========================================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      const finalCategory =
        form.category ===
        "custom"
          ? form.customCategory.trim()
          : form.category;

      const finalUnit =
        form.unit ===
        "custom"
          ? form.customUnit.trim()
          : form.unit;

      if (
        !finalCategory ||
        !finalUnit
      ) {
        return alert(
          "Custom category/unit required"
        );
      }

      const payload = {
        name: form.name.trim(),

        category:
          finalCategory,

        unit: finalUnit,

        stock: Number(
          form.stock
        ),

        costPrice: Number(
          form.costPrice
        ),

        sellingPrice:
  Number(form.sellingPrice),

discountPercentage:
  Number(
    form.discountPercentage || 0
  ),

finalSellingPrice,
        minimumStock:
          Number(
            form.minimumStock
          ),
      };

      try {
        if (editingId) {
          await productAPI.update(
            editingId,
            payload
          );
        } else {
          await productAPI.create(
            payload
          );
        }

        await fetchProducts();

        await fetchStats();

        resetForm();
      } catch (err) {
        alert(
          err.response?.data
            ?.message ||
            "Failed"
        );
      }
    };

  // ========================================
  // EDIT
  // ========================================

  const handleEdit = (
    product
  ) => {
    setForm({
      name: product.name,

      category:
        categoryOptions.includes(
          product.category
        )
          ? product.category
          : "custom",

      customCategory:
        product.category,

      unit:
        unitOptions.includes(
          product.unit
        )
          ? product.unit
          : "custom",

      customUnit:
        product.unit,

      stock: product.stock,

      costPrice:
        product.costPrice,

      sellingPrice:
        product.sellingPrice,
        discountPercentage:
  product.discountPercentage || 0,
finalSellingPrice:
  product.finalSellingPrice,
      minimumStock:
        product.minimumStock,
    });

    setEditingId(product._id);
  };

  // ========================================
  // DELETE
  // ========================================

  const handleDelete =
    async (id) => {
      try {
        await productAPI.delete(id);

        await fetchProducts();

        await fetchStats();
      } catch (err) {
        console.log(err);
      }
    };
const downloadProductReport = async () => {
  try {
    setDownloading(true);

    const response = await api.get(
      "/invoices/product-report/pdf",
      {
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-report-${Date.now()}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Download Error:", error);
    alert("Failed to download product report");
  } finally {
    setDownloading(false);
  }
};
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* SUMMARY */}

   <div className="flex justify-between items-center mb-6">
 

  <button
    onClick={downloadProductReport}
    disabled={downloading}
    className={`
      flex items-center gap-2 px-5 py-3 rounded-lg font-semibold
      transition-all duration-300
      ${
        downloading
          ? "bg-gray-500 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95"
      }
      text-white shadow-md
    `}
  >
    {downloading ? (
      <>
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        Downloading...
      </>
    ) : (
      <>⬇ Download Report</>
    )}
  </button>
</div>

<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="card p-4">
          <p>Total Products</p>

          <h2 className="text-2xl font-bold">
            {
              summary?.totalProducts
            }
          </h2>
        </div>

        <div className="card p-4">
          <p>Inventory Value</p>

          <h2 className="text-2xl font-bold">
          
           {formatCurrency(
  summary?.inventoryValue
)}
          </h2>
        </div>

        <div className="card p-4">
          <p>Total Expected Profit</p>

          <h2 className="text-2xl font-bold">
           {formatCurrency(
  summary?.expectedProfit
)}
          </h2>
        </div>

        <div className="card p-4">
          <p>Sales Profit</p>

          <h2 className="text-2xl font-bold">
           {formatCurrency(
  summary?.totalSalesProfit
)}
          </h2>
        </div>
        <div className="card p-4">
  <p>Total Revenue</p>
<h2 className="text-2xl font-bold">
  {formatCurrency(
    summary?.totalSales
  )}
</h2>
</div>
      </div>

      {/* FORM */}

<div className="card p-6 mb-8">
  <h2 className="text-2xl font-bold mb-6">
    {editingId
      ? "Update Product"
      : "Add Product"}
  </h2>

  <form
    onSubmit={handleSubmit}
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start"
  >
    {/* PRODUCT NAME */}

    <div>
      <label className="label">
        Product Name
      </label>

      <input
        type="text"
        name="name"
        className="input"
        placeholder="Enter product name"
        value={form.name}
        onChange={handleChange}
        required
      />
    </div>

    {/* CATEGORY */}

    <div className="flex flex-col gap-2">
      <label className="label">
        Product Category
      </label>

      <select
        name="category"
        className="input"
        value={form.category}
        onChange={handleChange}
      >
        {categoryOptions.map(
          (cat) => (
            <option
              key={cat}
              value={cat}
            >
              {cat}
            </option>
          )
        )}

        <option value="custom">
          Custom
        </option>
      </select>

      {form.category ===
        "custom" && (
        <input
          type="text"
          name="customCategory"
          className="input"
          placeholder="Enter custom category"
          value={
            form.customCategory
          }
          onChange={
            handleChange
          }
          required
        />
      )}
    </div>

    {/* UNIT */}

    <div className="flex flex-col gap-2">
      <label className="label">
        Measurement Unit
      </label>

      <select
        name="unit"
        className="input"
        value={form.unit}
        onChange={handleChange}
      >
        {unitOptions.map(
          (unit) => (
            <option
              key={unit}
              value={unit}
            >
              {unit}
            </option>
          )
        )}

        <option value="custom">
          Custom
        </option>
      </select>

      {form.unit ===
        "custom" && (
        <input
          type="text"
          name="customUnit"
          className="input"
          placeholder="Enter custom unit"
          value={
            form.customUnit
          }
          onChange={
            handleChange
          }
          required
        />
      )}
    </div>

    {/* AVAILABLE STOCK */}

    <div>
      <label className="label">
        Available Quantity
      </label>

      <input
        type="number"
        name="stock"
        className="input"
        placeholder="Enter stock quantity"
        value={form.stock}
        onChange={handleChange}
        required
      />
    </div>

    {/* PURCHASE PRICE */}

    <div>
      <label className="label">
        Purchase Price
      </label>

      <input
        type="number"
        name="costPrice"
        className="input"
        placeholder="Buying price"
        value={form.costPrice}
        onChange={handleChange}
        required
      />
    </div>

    {/* SELLING PRICE */}

    <div>
      <label className="label">
        Selling Price
      </label>

      <input
        type="number"
        name="sellingPrice"
        className="input"
        placeholder="Selling price"
        value={
          form.sellingPrice
        }
        onChange={handleChange}
        required
      />
    </div>
<div>
  <label className="label">
    Discount %
  </label>

  <input
    type="number"
    name="discountPercentage"
    className="input"
    placeholder="Optional"
    value={
      form.discountPercentage
    }
    onChange={handleChange}
  />
</div>


<div>
  <label className="label">
    Final Selling Price
  </label>

<input
  type="number"
  name="finalSellingPrice"
  className="input"
  value={
    form.finalSellingPrice ||
    finalSellingPrice
  }
  onChange={
    handleFinalSellingPriceChange
  }
/>
</div>  
    {/* INVENTORY VALUE */}

    <div>
      <label className="label">
        Total Inventory Value
      </label>

      <input
        type="text"
        className="input"
        value={formatCurrency(
          totalValue
        )}
        readOnly
      />
    </div>

    {/* EXPECTED PROFIT */}

    <div>
      <label className="label">
        Estimated Profit
      </label>

      <input
        type="text"
        className="input"
        value={`₹${expectedProfit}`}
        readOnly
      />
    </div>

    {/* LOW STOCK ALERT */}

    <div>
      <label className="label">
        Low Stock Alert Limit
      </label>

      <input
        type="number"
        name="minimumStock"
        className="input"
        placeholder="Minimum quantity alert"
        value={
          form.minimumStock
        }
        onChange={handleChange}
      />
    </div>

    {/* BUTTONS */}

   <div className="lg:col-span-4 flex justify-center gap-3 pt-4">
      <button
        type="submit"
        className="btn-primary"
      >
        {editingId
          ? "Update Product"
          : "Add Product"}
      </button>

      {editingId && (
        <button
          type="button"
          className="btn-ghost"
          onClick={resetForm}
        >
          Cancel
        </button>
      )}
    </div>
  </form>
</div>

{/* FILTERS */}

<div className="card p-5 mb-6">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div>
      <label className="label">
        Search Product
      </label>

      <input
        type="text"
        name="search"
        className="input"
        placeholder="Search by name"
        value={filters.search}
        onChange={
          handleFilterChange
        }
      />
    </div>

    <div>
      <label className="label">
        Filter Category
      </label>

      <select
        name="category"
        className="input"
        value={
          filters.category
        }
        onChange={
          handleFilterChange
        }
      >
        <option value="All">
          All Categories
        </option>

        {categoryOptions.map(
          (cat) => (
            <option
              key={cat}
              value={cat}
            >
              {cat}
            </option>
          )
        )}
      </select>
    </div>

    <div>
      <label className="label">
        Stock Status
      </label>

      <select
        name="stockStatus"
        className="input"
        value={
          filters.stockStatus
        }
        onChange={
          handleFilterChange
        }
      >
        <option value="All">
          All Stock
        </option>

        <option value="instock">
          In Stock
        </option>

        <option value="low">
          Low Stock
        </option>

        <option value="outofstock">
          Out Of Stock
        </option>
      </select>
    </div>

    <div className="flex items-end">
      <button
        onClick={applyFilters}
        className="btn-primary w-full"
      >
        Apply Filters
      </button>
    </div>
  </div>
</div>

{/* TABLE */}

<div className="card overflow-hidden">
 <div className="overflow-x-auto pb-2">
  <table className="min-w-[1450px] w-full">
      <thead>
        <tr>
          <th className="px-5 py-4 text-left">
            Product Name
          </th>

          <th className="px-5 py-4 text-left">
            Category
          </th>

          <th className="px-5 py-4 text-left">
            Available Qty
          </th>

          <th className="px-5 py-4 text-left">
            Selling Price
          </th>
           <th className="px-5 py-4 text-left">
            Discount % 
          </th>
           <th className="px-5 py-4 text-left">
             Final Selling Price 
          </th>
          
          <th className="px-5 py-4 text-left">
            Inventory Value
          </th>

          <th className="px-5 py-4 text-left">
            Total Revenue
          </th>

          <th className="px-5 py-4 text-left">
            Net Profit
          </th>

          <th className="px-5 py-4 text-left">
            Stock Status
          </th>

          <th className="px-5 py-4 text-right">
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        {products.map(
          (product) => (
            <tr
              key={product._id}
              className="border-b"
            >
       <td className="px-4 py-4 min-w-[280px] max-w-[320px] align-top">
  <div
    className="
      break-words
      whitespace-normal
      leading-6
      text-sm
      font-semibold
    "
    title={product.name}
  >
    {product.name}
  </div>
</td>

              <td className="px-5 py-4">
                {product.category}
              </td>

              <td className="px-5 py-4">
                {product.stock}{" "}
                {product.unit}
              </td>

              <td className="px-5 py-4">
             {formatCurrency(
      product.sellingPrice
    )}
              </td>
  {/* DISCOUNT */}

  <td className="px-5 py-4">
    {Number(
      product.discountPercentage || 0
    ) > 0
      ? `${product.discountPercentage}%`
      : "-"}
  </td>

  {/* FINAL SELL PRICE */}

  <td className="px-5 py-4">
    {formatCurrency(
      product.finalSellingPrice ||
      product.sellingPrice
    )}
  </td>

              <td className="px-5 py-4">
                
                    {formatCurrency(product.totalValue)}
              </td>

              <td className="px-5 py-4">
                 {formatCurrency(
      product.totalSales
    )}
              </td>

              <td className="px-5 py-4">
                  {formatCurrency(
                  product.totalSalesProfit)
                }
              </td>

              <td className="px-5 py-4">
                {product.stock <=
                0 ? (
                  <span className="text-red-600 font-semibold">
                    Out Of Stock
                  </span>
                ) : product.stock <=
                  product.minimumStock ? (
                  <span className="text-orange-500 font-semibold">
                    Low Stock
                  </span>
                ) : (
                  <span className="text-green-600 font-semibold">
                    In Stock
                  </span>
                )}
              </td>

              <td className="px-5 py-4">
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() =>
                      handleEdit(
                        product
                      )
                    }
                    className="text-blue-600 font-medium"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(
                        product._id
                      )
                    }
                    className="text-red-500 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  </div>
</div>
    </div>

    
  );
};

export default InventoryPage;