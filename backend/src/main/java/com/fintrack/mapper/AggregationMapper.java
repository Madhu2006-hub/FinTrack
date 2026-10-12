package com.fintrack.mapper;

import com.fintrack.dto.CategoryTotal;
import com.fintrack.entity.Category;
import com.fintrack.entity.TransactionType;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Converts repository aggregate rows into sorted, typed totals. */
public final class AggregationMapper {

    private AggregationMapper() {
    }

    public static Map<Category, BigDecimal> toCategoryMap(List<Object[]> rows) {
        Map<Category, BigDecimal> map = new EnumMap<>(Category.class);
        for (Object[] row : rows) {
            map.put((Category) row[0], (BigDecimal) row[1]);
        }
        return map;
    }

    public static List<CategoryTotal> toSortedTotals(List<Object[]> rows) {
        return rows.stream()
                .map(row -> new CategoryTotal((Category) row[0], (BigDecimal) row[1]))
                .sorted(Comparator.comparing(CategoryTotal::amount).reversed())
                .toList();
    }

    public static Map<YearMonth, Map<TransactionType, BigDecimal>> toMonthlyTypeMap(List<Object[]> rows) {
        Map<YearMonth, Map<TransactionType, BigDecimal>> map = new HashMap<>();
        for (Object[] row : rows) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            YearMonth ym = YearMonth.of(year, month);
            TransactionType type = row[2] instanceof TransactionType tt ? tt : TransactionType.valueOf(row[2].toString());
            BigDecimal amount = (BigDecimal) row[3];
            map.computeIfAbsent(ym, k -> new EnumMap<>(TransactionType.class)).put(type, amount);
        }
        return map;
    }
}

