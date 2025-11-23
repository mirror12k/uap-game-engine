// Minimal 2D Physics Engine for rectangles
export class RigidBody {
  constructor(x, y, width, height, mass = 1.0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.mass = mass;
    this.velocityX = 0;
    this.velocityY = 0;
    this.restitution = 0.5; // Bounciness (0 = no bounce, 1 = perfect bounce)
    this.friction = 0.98; // Air friction
  }

  applyForce(fx, fy) {
    // F = ma, so a = F/m
    this.velocityX += fx / this.mass;
    this.velocityY += fy / this.mass;
  }

  update(delta) {
    // Update position based on velocity
    this.x += this.velocityX * delta;
    this.y += this.velocityY * delta;

    // Apply friction
    this.velocityX *= this.friction;
    this.velocityY *= this.friction;
  }

  // Check if this body overlaps with another
  overlaps(other) {
    return !(
      this.x + this.width < other.x ||
      this.x > other.x + other.width ||
      this.y + this.height < other.y ||
      this.y > other.y + other.height
    );
  }

  // Get the center position
  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }
}

export class PhysicsWorld {
  constructor(width, height, gravity = 500) {
    this.width = width;
    this.height = height;
    this.gravity = gravity;
    this.bodies = [];
  }

  addBody(body) {
    this.bodies.push(body);
    return body;
  }

  removeBody(body) {
    const index = this.bodies.indexOf(body);
    if (index > -1) {
      this.bodies.splice(index, 1);
    }
  }

  update(delta) {
    // Apply gravity to all bodies
    for (const body of this.bodies) {
      body.applyForce(0, this.gravity * body.mass * delta);
      body.update(delta);
    }

    // Handle collisions with boundaries
    for (const body of this.bodies) {
      this.handleBoundaryCollision(body);
    }

    // Handle collisions between bodies
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        if (this.bodies[i].overlaps(this.bodies[j])) {
          this.resolveCollision(this.bodies[i], this.bodies[j]);
        }
      }
    }
  }

  handleBoundaryCollision(body) {
    // Left boundary
    if (body.x < 0) {
      body.x = 0;
      body.velocityX = -body.velocityX * body.restitution;
    }

    // Right boundary
    if (body.x + body.width > this.width) {
      body.x = this.width - body.width;
      body.velocityX = -body.velocityX * body.restitution;
    }

    // Top boundary
    if (body.y < 0) {
      body.y = 0;
      body.velocityY = -body.velocityY * body.restitution;
    }

    // Bottom boundary
    if (body.y + body.height > this.height) {
      body.y = this.height - body.height;
      body.velocityY = -body.velocityY * body.restitution;

      // Add some damping when resting on the ground
      if (Math.abs(body.velocityY) < 10) {
        body.velocityY = 0;
        body.velocityX *= 0.95;
      }
    }
  }

  resolveCollision(a, b) {
    // Calculate overlap on each axis
    const overlapX = Math.min(
      a.x + a.width - b.x,
      b.x + b.width - a.x
    );
    const overlapY = Math.min(
      a.y + a.height - b.y,
      b.y + b.height - a.y
    );

    // Resolve collision on the axis with smallest overlap
    if (overlapX < overlapY) {
      // Horizontal collision
      const direction = a.getCenterX() < b.getCenterX() ? -1 : 1;
      const pushDistance = overlapX / 2;

      a.x += direction * pushDistance;
      b.x -= direction * pushDistance;

      // Exchange velocities with restitution
      const avgRestitution = (a.restitution + b.restitution) / 2;
      const tempVelX = a.velocityX;
      a.velocityX = b.velocityX * avgRestitution;
      b.velocityX = tempVelX * avgRestitution;
    } else {
      // Vertical collision
      const direction = a.getCenterY() < b.getCenterY() ? -1 : 1;
      const pushDistance = overlapY / 2;

      a.y += direction * pushDistance;
      b.y -= direction * pushDistance;

      // Exchange velocities with restitution
      const avgRestitution = (a.restitution + b.restitution) / 2;
      const tempVelY = a.velocityY;
      a.velocityY = b.velocityY * avgRestitution;
      b.velocityY = tempVelY * avgRestitution;
    }
  }
}
