export interface DataSensus {
    uuid: string;
    created_at: Date;
    name: string;
    kelompok: Kelompok;
    date_of_birth: Date;
    gender: Gender;
    age: string;
    level: Level;
    marriage_status: MarriageStatus;
    family_name: string;
    id_family: number;
    is_active: boolean;
    is_educate: boolean;
    is_duafa: boolean;
    is_binaan: boolean;
}

export interface ListFamilyProps {
    id: number;
    created_at: Date;
    name: string;
}

export interface DataOrder {
    id: number;
    created_at: Date;
    user_name: string;
    total_order: number;
    id_category_order: number;
    name_category: string;
    user_id: string;
    is_payment: boolean;
    note: string;
    actual_price: number;
    unit_price: number;
}

export interface DataFamily {
    value: number;
    label: string;
    id: string;
}[]

export interface DataDropdown {
    value: number;
    label: string;
    id?: string;
    price?: string;
    name?: string;
}[]

export interface DataCategory {
    id: number;
    // created_at: string;
    name: string;
    year: string;
    price: string;
}

export interface SelectedCategoryProps {
    label: string;
    value: string;
    id: string;
    name: string;
    price: string;
}

export interface DataFolder {
    created_at: string
    id: number;
    name: string;
    formatRupiah?: string;
    price: string;
    year: number;
}


export interface DataCountProps {
    id: number;
    level: Level;
}

export enum Gender {
    LakiLaki = "Laki - Laki",
    Perempuan = "Perempuan",
}

export enum Kelompok {
    Kelompok1 = "Kelompok 1",
}

export enum Level {
    Balita = "Balita",
    CabeRawit = "Cabe Rawit",
    Dewasa = "Dewasa",
    Lansia = "Lansia",
    PraNikah = "Pra Nikah",
    PraRemaja = "Pra Remaja",
    Remaja = "Remaja",
}

export enum MarriageStatus {
    BelumMenikah = "Belum Menikah",
    Duda = "Duda",
    Janda = "Janda",
    Menikah = "Menikah",
}

export interface VersionData {
    id: number;
    version: string;
    created_at: string;
    os_name: string;
}