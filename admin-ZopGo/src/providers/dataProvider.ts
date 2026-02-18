/**
 * ZopGo Admin — Refine DataProvider custom pour Supabase
 *
 * Implémente les méthodes DataProvider de Refine en utilisant
 * le client Supabase JS (avec JWT Clerk injecté).
 */

import type { DataProvider, BaseRecord } from "@refinedev/core";
import { supabase } from "@/config/supabase";

type CrudFilter = {
    field: string;
    operator: string;
    value: unknown;
};

type CrudSort = {
    field: string;
    order: "asc" | "desc";
};

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Applique les filtres Refine sur une query Supabase
 */
function applyFilters(query: any, filters?: CrudFilter[]): any {
    if (!filters?.length) return query;

    let q = query;
    for (const filter of filters) {
        const { field, operator, value } = filter;
        switch (operator) {
            case "eq":
                q = q.eq(field, value);
                break;
            case "ne":
                q = q.neq(field, value);
                break;
            case "lt":
                q = q.lt(field, value);
                break;
            case "lte":
                q = q.lte(field, value);
                break;
            case "gt":
                q = q.gt(field, value);
                break;
            case "gte":
                q = q.gte(field, value);
                break;
            case "in":
                q = q.in(field, value as unknown[]);
                break;
            case "contains":
                q = q.ilike(field, `%${value}%`);
                break;
            case "null":
                if (value) {
                    q = q.is(field, null);
                } else {
                    q = q.not(field, "is", null);
                }
                break;
            default:
                q = q.eq(field, value);
        }
    }
    return q;
}

/**
 * Applique le tri Refine
 */
function applySorters(query: any, sorters?: CrudSort[]): any {
    if (!sorters?.length) return query;

    let q = query;
    for (const sorter of sorters) {
        q = q.order(sorter.field, { ascending: sorter.order === "asc" });
    }
    return q;
}

export const dataProvider: DataProvider = {
    getList: async ({ resource, pagination, filters, sorters, meta }): Promise<any> => {
        const { current = 1, pageSize = 10, mode = "server" } = pagination ?? {};
        const selectFields = (meta?.select as string) ?? "*";

        let query = supabase.from(resource).select(selectFields, { count: "exact" });

        // Soft delete filter (always exclude deleted records)
        query = query.is("deleted_at", null);

        // Apply user filters
        query = applyFilters(query, filters as CrudFilter[]);

        // Apply sorting
        query = applySorters(query, sorters as CrudSort[]);

        // Pagination (server-side)
        if (mode === "server") {
            const from = (current - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;

        if (error) {
            throw new Error(error.message);
        }

        return {
            data: (data ?? []) as BaseRecord[],
            total: count ?? 0,
        };
    },

    getOne: async ({ resource, id, meta }): Promise<any> => {
        const selectFields = (meta?.select as string) ?? "*";

        const { data, error } = await supabase
            .from(resource)
            .select(selectFields)
            .eq("id", id as string)
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return { data: data as BaseRecord };
    },

    create: async ({ resource, variables }): Promise<any> => {
        const { data, error } = await supabase
            .from(resource)
            .insert(variables as Record<string, unknown>)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return { data: data as BaseRecord };
    },

    update: async ({ resource, id, variables }): Promise<any> => {
        const { data, error } = await supabase
            .from(resource)
            .update(variables as Record<string, unknown>)
            .eq("id", id as string)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return { data: data as BaseRecord };
    },

    deleteOne: async ({ resource, id }): Promise<any> => {
        // Soft delete: set deleted_at instead of real DELETE
        const { data, error } = await supabase
            .from(resource)
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id as string)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return { data: data as BaseRecord };
    },

    getMany: async ({ resource, ids, meta }): Promise<any> => {
        const selectFields = (meta?.select as string) ?? "*";

        const { data, error } = await supabase
            .from(resource)
            .select(selectFields)
            .in("id", ids as string[])
            .is("deleted_at", null);

        if (error) {
            throw new Error(error.message);
        }

        return { data: (data ?? []) as BaseRecord[] };
    },

    getApiUrl: () => import.meta.env.VITE_SUPABASE_URL,
};
