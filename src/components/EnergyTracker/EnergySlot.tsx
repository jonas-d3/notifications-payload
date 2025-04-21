import { useState } from "react";
import styles from "./EnergySlot.module.css";
import { EnergyDataPoint } from "@/types/Energy";
export default function EnergySlot({ data }: { data: EnergyDataPoint }) {
  const [interactive, setInteractive] = useState(false);
  const [value, setValue] = useState(data.value);
  const classes = {
    "": "text-white",
    zzz: "bg-gray-300 text-black",
    low: "bg-red-300 text-black",
    med: "bg-yellow-300 text-black",
    hi: "bg-green-300 text-black",
  };
  return (
    <div className="w-full grid grid-cols-5 items-center">
      <span className="text-white text-center">{data.time}</span>
      {!interactive && (
        <button
          className={classes[value] + " col-span-4 " + styles.btn}
          onClick={() => setInteractive(true)}
        >
          {data.value || "zzz, low, med or hi?"}
        </button>
      )}
      {interactive && (
        <>
          <button
            className={styles.btn}
            onClick={() => {
              setValue("zzz");
              setInteractive(false);
            }}
          >
            zzz
          </button>
          <button
            className={styles.btn}
            onClick={() => {
              setValue("low");
              setInteractive(false);
            }}
          >
            low
          </button>
          <button
            className={styles.btn}
            onClick={() => {
              setValue("med");
              setInteractive(false);
            }}
          >
            med
          </button>
          <button
            className={styles.btn}
            onClick={() => {
              setValue("hi");
              setInteractive(false);
            }}
          >
            hi
          </button>
        </>
      )}
    </div>
  );
}
