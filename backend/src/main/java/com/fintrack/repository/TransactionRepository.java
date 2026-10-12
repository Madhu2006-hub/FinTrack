package com.fintrack.repository;

import com.fintrack.entity.Category;
import com.fintrack.entity.Transaction;
import com.fintrack.entity.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Every query is scoped by userId, so one user can never read or aggregate another user's rows.
 */
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByIdAndUserId(Long id, Long userId);

    List<Transaction> findTop5ByUserIdOrderByTransactionDateDescIdDesc(Long userId);

    @Query("""
            select t from Transaction t
            where t.user.id = :userId
              and (:type is null or t.type = :type)
              and (:category is null or t.category = :category)
              and (:fromDate is null or t.transactionDate >= :fromDate)
              and (:toDate is null or t.transactionDate <= :toDate)
              and (:search is null or lower(t.title) like lower(concat('%', :search, '%')))
            """)
    Page<Transaction> search(@Param("userId") Long userId,
                             @Param("type") TransactionType type,
                             @Param("category") Category category,
                             @Param("fromDate") LocalDate fromDate,
                             @Param("toDate") LocalDate toDate,
                             @Param("search") String search,
                             Pageable pageable);

    @Query("""
            select coalesce(sum(t.amount), 0) from Transaction t
            where t.user.id = :userId
              and t.type = :type
              and t.transactionDate between :fromDate and :toDate
            """)
    BigDecimal sumByTypeBetween(@Param("userId") Long userId,
                                @Param("type") TransactionType type,
                                @Param("fromDate") LocalDate fromDate,
                                @Param("toDate") LocalDate toDate);

    @Query("""
            select t.category, coalesce(sum(t.amount), 0) from Transaction t
            where t.user.id = :userId
              and t.type = :type
              and t.transactionDate between :fromDate and :toDate
            group by t.category
            """)
    List<Object[]> sumByCategoryBetween(@Param("userId") Long userId,
                                        @Param("type") TransactionType type,
                                        @Param("fromDate") LocalDate fromDate,
                                        @Param("toDate") LocalDate toDate);

    @Query("""
            select year(t.transactionDate), month(t.transactionDate), t.type, coalesce(sum(t.amount), 0)
            from Transaction t
            where t.user.id = :userId
              and t.transactionDate between :fromDate and :toDate
            group by year(t.transactionDate), month(t.transactionDate), t.type
            """)
    List<Object[]> sumByMonthAndTypeBetween(@Param("userId") Long userId,
                                            @Param("fromDate") LocalDate fromDate,
                                            @Param("toDate") LocalDate toDate);
}
