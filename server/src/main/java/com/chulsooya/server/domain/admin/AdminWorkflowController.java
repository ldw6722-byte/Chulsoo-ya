package com.chulsooya.server.domain.admin;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.admin.AdminWorkflowDtos.ForceSlotsRequest;
import com.chulsooya.server.domain.admin.AdminWorkflowDtos.StoreActivity;
import com.chulsooya.server.domain.admin.AdminWorkflowDtos.WorkflowOrder;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/admin")
public class AdminWorkflowController {
    private final AdminWorkflowService workflowService;
    public AdminWorkflowController(AdminWorkflowService workflowService) { this.workflowService = workflowService; }
    @GetMapping("/workflow/orders")
    public ApiResponse<List<WorkflowOrder>> orders(CurrentUser user) { return ApiResponse.of(workflowService.workflowOrders(user)); }
    @GetMapping("/stores/{storeId}/activity")
    public ApiResponse<StoreActivity> activity(CurrentUser user, @PathVariable Long storeId) { return ApiResponse.of(workflowService.storeActivity(user, storeId)); }
    @PostMapping("/stores/{storeId}/force-slots")
    public ApiResponse<StoreActivity> forceSlots(CurrentUser user, @PathVariable Long storeId, @Valid @RequestBody ForceSlotsRequest request) { return ApiResponse.of(workflowService.forceSlots(user, storeId, request)); }
}
