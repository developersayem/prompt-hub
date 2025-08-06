"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

interface ICountry {
  name: string;
  dial_code: string;
  emoji: string;
}
interface ICountryData {
  idd: {
    root: string;
    suffixes: string[];
  };
  name: {
    common: string;
  };
  flag: string;
}

interface IProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function CountryCodeSelect({ value, onChange }: IProps) {
  const [countries, setCountries] = useState<ICountry[]>([]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,flag,idd"
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();

        const parsed = data
          .map((c: ICountryData) => {
            const root = c.idd?.root;
            const suffixes = c.idd?.suffixes;
            const name = c.name?.common;
            const emoji = c.flag || "🌐";

            if (!root || !suffixes || !name) return null;

            return suffixes.map((suffix: string) => ({
              name,
              dial_code: `${root}${suffix}`,
              emoji,
            }));
          })
          .flat()
          .filter(Boolean)
          .sort((a: ICountry, b: ICountry) => a.name.localeCompare(b.name));

        setCountries(parsed);
      } catch (error) {
        console.error("Failed to load countries", error);
      }
    };

    fetchCountries();
  }, []);

  return (
    <div className="space-y-2 col-span-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-accent">
          <SelectValue>{value || "Select country code"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem
              key={country.dial_code + country.name}
              value={country.dial_code}
            >
              {country.emoji} {country.name} ({country.dial_code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
