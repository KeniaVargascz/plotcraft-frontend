import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Legacy route /comunidades/nueva — duplicated the inline create flow that
 * already lives inside `MyCommunitiesPageComponent`. We keep this component
 * as a thin redirect so existing links/bookmarks open the canonical UI with
 * the create panel pre-expanded.
 */
@Component({
  selector: 'app-create-community-page',
  standalone: true,
  template: '',
})
export class CreateCommunityPageComponent implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.router.navigate(['/mis-comunidades'], {
      queryParams: { nueva: 1 },
      replaceUrl: true,
    });
  }
}
